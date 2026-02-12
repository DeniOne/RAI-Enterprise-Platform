
import { PrismaClient, AssetStatus, MachineryType, StockItemType, ObservationIntent, IntegrityStatus } from '@rai/prisma-client';
import { IntegrityGateService } from './apps/api/src/modules/integrity/integrity-gate.service';
import { DeviationService } from './apps/api/src/modules/cmr/deviation.service';
import { RegistryAgentService } from './apps/api/src/modules/integrity/registry-agent.service';
import { Test } from '@nestjs/testing';
import { PrismaService } from './apps/api/src/shared/prisma/prisma.service';
import { ConsultingService } from './apps/api/src/modules/consulting/consulting.service';

const prisma = new PrismaClient();

// Mocks needed for NestJS context
const mockTelegram = {
    sendAssetProposal: jest.fn(),
    sendMessage: jest.fn(),
};

async function main() {
    console.log("🚀 Starting Beta Integrity Verification...");

    // Setup NestJS Context (Minimal)
    const moduleRef = await Test.createTestingModule({
        providers: [
            IntegrityGateService,
            { provide: PrismaService, useValue: prisma },
            { provide: 'TelegramNotificationService', useValue: mockTelegram }, // Mock token
            { provide: DeviationService, useValue: { createReview: jest.fn() } }, // Mock complex deps
            { provide: ConsultingService, useValue: { openConsultationThread: jest.fn() } },
            RegistryAgentService,
        ],
    }).compile();

    const gate = moduleRef.get(IntegrityGateService);

    // --- SCENARIO 1: Conversational Confirmation ---
    console.log("\n🧪 Scenario 1: Conversational Confirmation Flow");

    // 1.1 Find Test Context
    const company = await prisma.company.findFirst();
    const user = await prisma.user.findFirst();
    let client = await prisma.account.findFirst({ where: { companyId: company?.id } }); // Ensure client belongs to company

    if (!client && company) {
        client = await prisma.account.create({
            data: {
                companyId: company.id,
                name: "Test Client Account",
            }
        });
    }

    if (!company || !user || !client) {
        console.error("❌ Pre-requisites missing (Company/Client/User). Run seed.");
        return;
    }

    // 1.2 Create DRAFT Asset (Simulate AI Agent)
    const draft = await prisma.machinery.create({
        data: {
            name: "Test Tractor Verify-" + Date.now(),
            type: "TRACTOR",
            status: "PENDING_CONFIRMATION",
            companyId: company.id,
            clientId: client.id,
            idempotencyKey: "HASH_" + Date.now(),
        }
    });
    console.log(`   - Created DRAFT Asset: ${draft.id}`);

    // 1.3 Simulate User "Ok"
    const obs = await prisma.fieldObservation.create({
        data: {
            companyId: company.id,
            authorId: user.id,
            timestamp: new Date(),
            type: "CALL_LOG",
            // INTENT is MONITORING initially (as per Dumb Transport)
            intent: "MONITORING",
            seasonId: (await prisma.season.findFirst())?.id || "",
            location: { lat: 0, lng: 0 },
            content: "ok confirm", // Keyword trigger
        }
    });

    console.log(`   - User replied: "${obs.content}"`);

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
