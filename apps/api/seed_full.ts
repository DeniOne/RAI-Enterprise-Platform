/**
 * seed_full.ts
 * Comprehensive seeding script for RAI Enterprise Platform.
 * 
 * This script:
 * 1. Ensures the Root Company exists.
 * 2. Creates standard Jurisdictions (RU, BY, KZ).
 * 3. Populates 2026 Regulatory Presets for these jurisdictions.
 * 4. Syncs persistent users from data/persistent_users.json.
 */

import { PrismaClient, UserRole, UserAccessLevel } from '@rai/prisma-client';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

// ─── Пресеты Регуляторных Профилей 2026 ───────────────────────────────────────

const PRESETS = [
    {
        code: 'RU_OSN_2026',
        name: 'РФ — Стандарт ОСН (НДС 22%)',
        jurisdictionCode: 'RU',
        rulesJson: {
            vatRate: 0.22,
            vatRateReduced: 0.10,
            crossBorderVatRate: 0,
            vatPayerStatus: 'PAYER',
            supplyType: 'GOODS',
            currencyCode: 'RUB',
            effectiveFrom: '2026-01-01',
            notes: 'ФЗ № 425-ФЗ от 28.11.2025. Основная ставка НДС повышена с 20% до 22%.',
        },
    },
    {
        code: 'RU_USN5_2026',
        name: 'РФ — УСН 5% (ниже порога)',
        jurisdictionCode: 'RU',
        rulesJson: {
            vatRate: 0.05,
            crossBorderVatRate: 0,
            vatPayerStatus: 'USN_5',
            supplyType: 'GOODS',
            currencyCode: 'RUB',
            effectiveFrom: '2026-01-01',
            notes: 'НК РФ ст.164. УСН: доход ≤ 20 млн руб./год. Ставка 5%.',
        },
    },
    {
        code: 'RU_EXPORT_2026',
        name: 'РФ — Экспорт (НДС 0%)',
        jurisdictionCode: 'RU',
        rulesJson: {
            vatRate: 0,
            vatRateZero: 0,
            crossBorderVatRate: 0,
            vatPayerStatus: 'PAYER',
            supplyType: 'GOODS',
            currencyCode: 'RUB',
            effectiveFrom: '2026-01-01',
            notes: 'НК РФ ст.164 п.1. Экспорт за пределы ЕАЭС — ставка 0%.',
        },
    },
    {
        code: 'BY_STD_2026',
        name: 'РБ — Стандарт (НДС 20%)',
        jurisdictionCode: 'BY',
        rulesJson: {
            vatRate: 0.20,
            vatRateReduced: 0.10,
            crossBorderVatRate: 0,
            vatPayerStatus: 'PAYER',
            supplyType: 'GOODS',
            currencyCode: 'BYN',
            effectiveFrom: '2026-01-01',
            notes: 'НК РБ. Основная ставка 20%, льготная 10%.',
        },
    },
    {
        code: 'KZ_STD_2026',
        name: 'КЗ — Стандарт (НДС 16%)',
        jurisdictionCode: 'KZ',
        rulesJson: {
            vatRate: 0.16,
            crossBorderVatRate: 0,
            vatPayerStatus: 'PAYER',
            supplyType: 'GOODS',
            currencyCode: 'KZT',
            effectiveFrom: '2026-01-01',
            notes: 'НК РК. С 01.01.2026 ставка НДС повышена с 12% до 16%.',
        },
    },
];

async function main() {
    console.log('🌱 Starting full database seed...\n');

    // 1. Ensure Root Company exists
    // First, try to find ANY existing company (for Dev Mode compatibility)
    let company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
    });

    if (!company) {
        company = await prisma.company.create({
            data: {
                id: 'default-rai-company',
                name: 'RAI Enterprise (Root)',
            },
        });
        console.log(`🏢 Created new Root Company: ${company.name} (${company.id})`);
    } else {
        // Update name if it's the auto-created one
        if (company.name === 'Dev Company (Auto)') {
            company = await prisma.company.update({
                where: { id: company.id },
                data: { name: 'RAI Enterprise (Root)' },
            });
        }
        console.log(`🏢 Using existing Company: ${company.name} (${company.id})`);
    }

    // 2. Create Jurisdictions
    const jurisdictions = [
        { code: 'RU', name: 'Российская Федерация' },
        { code: 'BY', name: 'Республика Беларусь' },
        { code: 'KZ', name: 'Республика Казахстан' },
    ];

    for (const j of jurisdictions) {
        const jur = await prisma.jurisdiction.upsert({
            where: {
                // @ts-ignore
                companyId_code: { companyId: company.id, code: j.code }
            },
            update: { name: j.name },
            create: {
                companyId: company.id,
                code: j.code,
                name: j.name,
            },
        });
        console.log(`🌍 Jurisdiction ensured: ${jur.code} - ${jur.name}`);
    }

    // 3. Seed Regulatory Presets
    console.log('\n⚖️ Seeding regulatory presets...');
    for (const preset of PRESETS) {
        const jur = await prisma.jurisdiction.findFirst({
            where: { companyId: company.id, code: preset.jurisdictionCode },
        });

        if (!jur) {
            console.warn(`⚠️ Skipping preset ${preset.code}: jurisdiction ${preset.jurisdictionCode} not found.`);
            continue;
        }

        await prisma.regulatoryProfile.upsert({
            where: {
                // @ts-ignore
                companyId_code: { companyId: company.id, code: preset.code },
            },
            create: {
                companyId: company.id,
                code: preset.code,
                name: preset.name,
                jurisdictionId: jur.id,
                rulesJson: preset.rulesJson as any,
                // @ts-ignore
                isSystemPreset: true,
            },
            update: {
                name: preset.name,
                rulesJson: preset.rulesJson as any,
                // @ts-ignore
                isSystemPreset: true,
            },
        });
        console.log(`✅ Regulatory Preset: ${preset.code}`);
    }

    // 4. Sync Persistent Users
    console.log('\n👤 Syncing persistent users...');
    const usersPath = path.resolve(__dirname, 'data/persistent_users.json');
    if (fs.existsSync(usersPath)) {
        const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
        for (const u of users) {
            await prisma.user.upsert({
                where: { telegramId: u.telegramId },
                update: {
                    email: u.email,
                    role: u.role as UserRole,
                    accessLevel: u.accessLevel as UserAccessLevel,
                    companyId: company.id,
                },
                create: {
                    telegramId: u.telegramId,
                    email: u.email,
                    role: u.role as UserRole,
                    accessLevel: u.accessLevel as UserAccessLevel,
                    companyId: company.id,
                    emailVerified: true,
                },
            });
            console.log(`👤 User synced: ${u.email} (TG: ${u.telegramId})`);
        }
    } else {
        console.log('⚠️ No persistent_users.json found.');
    }

    console.log('\n🎉 Full seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
