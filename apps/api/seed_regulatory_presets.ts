/**
 * seed_regulatory_presets.ts
 * Создаёт 7 системных пресетов регуляторных профилей 2026 года.
 * Запускать: npx ts-node seed_regulatory_presets.ts
 *
 * Источники:
 * - РФ: ФЗ № 425-ФЗ от 28.11.2025 (НДС 22%), НК РФ ст.164
 * - РБ: НК РБ, ред. 2026 (НДС 20%)
 * - КЗ: НК РК, ред. 2026 (НДС 16%, было 12%)
 */

import { PrismaClient } from '@rai/prisma-client';

const prisma = new PrismaClient();

// ─── Типы ──────────────────────────────────────────────────────────────────────

interface RegulatoryRulesJson {
    vatRate: number;
    vatRateReduced?: number;
    vatRateZero?: number;
    crossBorderVatRate: number;
    vatPayerStatus: 'PAYER' | 'NON_PAYER' | 'USN_5' | 'USN_7';
    supplyType: 'GOODS' | 'SERVICE' | 'LEASE';
    currencyCode: 'RUB' | 'BYN' | 'KZT';
    effectiveFrom: string;
    effectiveTo?: string;
    notes?: string;
}

interface PresetDef {
    code: string;
    name: string;
    jurisdictionCode: string;
    rulesJson: RegulatoryRulesJson;
}

// ─── Пресеты 2026 ─────────────────────────────────────────────────────────────

const PRESETS: PresetDef[] = [
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
        code: 'RU_USN7_2026',
        name: 'РФ — УСН 7% (выше порога)',
        jurisdictionCode: 'RU',
        rulesJson: {
            vatRate: 0.07,
            crossBorderVatRate: 0,
            vatPayerStatus: 'USN_7',
            supplyType: 'GOODS',
            currencyCode: 'RUB',
            effectiveFrom: '2026-01-01',
            notes: 'НК РФ ст.164. УСН: доход > 20 млн руб./год. Ставка 7%.',
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
            notes: 'НК РБ. Основная ставка 20%, льготная 10% (социально значимые товары).',
        },
    },
    {
        code: 'BY_EXPORT_2026',
        name: 'РБ — Экспорт (НДС 0%)',
        jurisdictionCode: 'BY',
        rulesJson: {
            vatRate: 0,
            vatRateZero: 0,
            crossBorderVatRate: 0,
            vatPayerStatus: 'PAYER',
            supplyType: 'GOODS',
            currencyCode: 'BYN',
            effectiveFrom: '2026-01-01',
            notes: 'НК РБ ст.102. Экспорт товаров за пределы РБ — ставка 0%.',
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

// ─── Seed ─────────────────────────────────────────────────────────────────────

async function main() {
    console.log('🌱 Seeding regulatory profile presets 2026...\n');

    // Получаем первую компанию (dev/prod)
    const company = await prisma.company.findFirst({
        orderBy: { createdAt: 'asc' },
    });
    if (!company) {
        console.error('❌ No company found. Run seed_user.ts first.');
        process.exit(1);
    }
    console.log(`🏢 Using company: ${company.name} (${company.id})\n`);

    for (const preset of PRESETS) {
        // Находим юрисдикцию по коду
        const jurisdiction = await prisma.jurisdiction.findFirst({
            where: { companyId: company.id, code: preset.jurisdictionCode },
        });

        if (!jurisdiction) {
            console.warn(`⚠️  Skipping ${preset.code}: jurisdiction ${preset.jurisdictionCode} not found. Create it first in the UI.`);
            continue;
        }

        await prisma.regulatoryProfile.upsert({
            where: {
                // @ts-ignore — Prisma compound unique может не быть в типах, используем code+companyId
                companyId_code: { companyId: company.id, code: preset.code },
            },
            create: {
                companyId: company.id,
                code: preset.code,
                name: preset.name,
                jurisdictionId: jurisdiction.id,
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

        console.log(`✅ ${preset.code} — ${preset.name}`);
    }

    console.log('\n🎉 Done! System presets are ready.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
