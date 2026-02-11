
import { PrismaClient, AssetStatus, MachineryType, StockItemType, ObservationIntent, IntegrityStatus } from '@rai/prisma-client';
import { Logger } from '@nestjs/common';
import { IntegrityGateService } from './src/modules/integrity/integrity-gate.service';
import { DeviationService } from './src/modules/cmr/deviation.service';
import { RegistryAgentService } from './src/modules/integrity/registry-agent.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from './src/shared/prisma/prisma.service';
import { TelegramNotificationService } from './src/modules/telegram/telegram-notification.service';
import { ConsultingService } from './src/modules/consulting/consulting.service';

const prisma = new PrismaClient();

// Mocks needed for NestJS context
const mockTelegram = {
    sendAssetProposal: () => { },
    sendMessage: () => { },
};

async function main() {
    console.log("🚀 Starting Beta Integrity Verification...");


    // Setup NestJS Context (Minimal)
    const moduleRef = await Test.createTestingModule({
        providers: [
            IntegrityGateService,
            { provide: PrismaService, useValue: prisma },
            { provide: TelegramNotificationService, useValue: mockTelegram }, // Mock token
            { provide: DeviationService, useValue: { createReview: () => { } } }, // Mock complex deps
            { provide: ConsultingService, useValue: { openConsultationThread: () => { } } },
            RegistryAgentService,
        ],
    })
        .setLogger(new Logger()) // ENABLE LOGS
        .compile();

    const gate = moduleRef.get(IntegrityGateService);

    // --- SCENARIO 1: Conversational Confirmation ---
    console.log("\n🧪 Scenario 1: Conversational Confirmation Flow");

    // 1.1 Find Test Context
    const company = await prisma.company.findFirst();
    const user = await prisma.user.findFirst();

    if (!company || !user) {
        console.error("❌ Pre-requisites missing (Company/User). Run seed.");
        return;
    }

    // Ensure Client exists
    let client = await prisma.account.findFirst({ where: { companyId: company.id, type: 'CLIENT' } });
    if (!client) {
        console.log("Creating temporary client...");
        client = await prisma.account.create({
            data: {
                name: "Test Client",
                type: 'CLIENT',
                companyId: company.id,
                // INN is optional
            }
        });
    }

    // 1.2 Create DRAFT Asset (Simulate AI Agent)
    const draft = await prisma.machinery.create({
        data: {
            name: "Test Tractor Verify-" + Date.now(),
            type: "TRACTOR",
            status: "PENDING_CONFIRMATION",
            companyId: company.id,
            accountId: client.id,
            idempotencyKey: "HASH_" + Date.now(),
        }
    });
    console.log(`   - Created DRAFT Asset: ${draft.id}`);

    let season = await prisma.season.findFirst();
    if (!season) {
        console.log("Creating temporary season...");
        // Ensure Rapeseed exists
        let rapeseed = await prisma.rapeseed.findFirst();
        if (!rapeseed) {
            rapeseed = await prisma.rapeseed.create({
                data: {
                    name: "Test Rapeseed " + Date.now(),
                    type: "WINTER",
                    vegetationPeriod: 100,
                    version: 1,
                    isLatest: true,
                }
            });
        }

        // Ensure Field exists (needed for Season)
        let field = await prisma.field.findFirst({ where: { companyId: company.id } });
        if (!field) {
            field = await prisma.field.create({
                data: {
                    cadastreNumber: "TEMP-SEASON-" + Date.now(),
                    area: 100,
                    soilType: "CHERNOZEM",
                    coordinates: {},
                    companyId: company.id,
                    clientId: client.id,
                }
            });
        }

        season = await prisma.season.create({
            data: {
                year: new Date().getFullYear(),
                status: "PLANNING",
                fieldId: field.id,
                rapeseedId: rapeseed.id,
                companyId: company.id,
            }
        });
    }

    // Ensure Field exists
    let field = await prisma.field.findFirst({ where: { companyId: company.id } });
    if (!field) {
        field = await prisma.field.create({
            data: {
                cadastreNumber: "TEMP-" + Date.now(),
                area: 100,
                soilType: "CHERNOZEM",
                coordinates: {},
                companyId: company.id,
                clientId: client.id,
            }
        });
    }

    // 1.3 Simulate User "Ok"
    const obs = await prisma.fieldObservation.create({
        data: {
            company: { connect: { id: company.id } },
            author: { connect: { id: user.id } },
            season: { connect: { id: season.id } },
            field: { connect: { id: field.id } },
            createdAt: new Date(),
            type: "CALL_LOG",
            // FORCE INTENT to test the Admission Rule (Loop) directly
            intent: "CONFIRMATION",
            coordinates: { lat: 0, lng: 0 },
            content: "ok confirm", // Keyword trigger
        }
    });

    console.log(`   - User replied: "${obs.content}"`);

    // DEBUG CHECK
    const checkDraft = await prisma.machinery.findUnique({ where: { id: draft.id } });
    console.log(`   [DEBUG] Pre-Gate Asset Check: ID=${checkDraft?.id}, Status=${checkDraft?.status}, Created=${checkDraft?.createdAt.toISOString()}`);

    // 1.4 Run Gate Logic
    await gate.processObservation(obs as any);

    // 1.5 Verification
    const activeAsset = await prisma.machinery.findUnique({ where: { id: draft.id } });
    if (activeAsset?.status === "ACTIVE") {
        console.log(`   ✅ SUCCESS: Asset became ACTIVE! ConfirmedBy: ${activeAsset.confirmedByUserId}`);
    } else {
        console.error(`   ❌ FAILED: Asset status is ${activeAsset?.status}`);
    }

    console.log("\n🏁 Verification Complete.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
