import { PrismaClient, TaskStatus, ObservationIntent, IntegrityStatus, RiskType } from '@rai/prisma-client';

const prisma = new PrismaClient();

async function runBetaIntegrityTest() {
    console.log('🚀 Starting Beta Integrity Test...');

    // 1. Setup Test Environment
    const company = await prisma.company.findFirst();
    const season = await prisma.season.findFirst({ where: { companyId: company?.id } });
    const user = await prisma.user.findFirst({ where: { companyId: company?.id } });

    if (!company || !season || !user) {
        console.error('❌ Missing prerequisite data (Company, Season, or User)');
        return;
    }

    console.log('--- SCENARIO A: Evidence Path (Photo + GPS) ---');
    // Create a task
    const taskA = await prisma.task.create({
        data: {
            name: 'TEST_TASK_EVIDENCE',
            companyId: company.id,
            seasonId: season.id,
            fieldId: season.fieldId,
            assigneeId: user.id,
            responsibleId: user.id,
            status: TaskStatus.IN_PROGRESS,
        }
    });

    // Simulate Photo + GPS from Bot (Dumb Transport)
    const observation = await prisma.fieldObservation.create({
        data: {
            companyId: company.id,
            seasonId: season.id,
            fieldId: season.fieldId,
            authorId: user.id,
            taskId: taskA.id,
            type: 'PHOTO',
            photoUrl: 'http://telegram.org/file/abc123',
            coordinates: { lat: 55.7512, lng: 37.6184 },
            intent: ObservationIntent.INCIDENT, // Integrated via IntegrityGateService
            integrityStatus: IntegrityStatus.STRONG_EVIDENCE,
        }
    });

    console.log(`✅ PHOTO Observation ${observation.id} created for Task ${taskA.id}`);

    // Note: Validation of the "Gate" reaction should happen via IntegrityGateService logic.
    // In a real e2e test, we'd wait for the async processObservation.

    console.log('\n--- SCENARIO B: Silence Path (SLA Expiration) ---');
    // Create an overdue task with SLA
    const taskB = await prisma.task.create({
        data: {
            name: 'TEST_TASK_SILENCE',
            companyId: company.id,
            seasonId: season.id,
            fieldId: season.fieldId,
            assigneeId: user.id,
            responsibleId: user.id,
            status: TaskStatus.IN_PROGRESS,
            slaExpiration: new Date(Date.now() - 1000 * 60 * 60 * 24), // Expired 1 day ago
        }
    });

    console.log(`✅ Overdue Task ${taskB.id} created (SLA Expired).`);
    console.log('Waiting for IntegrityGate cron (checkTaskSilence)...');

    // In this script, we can't trigger NestJS crons, but we can verify the DB state
    // Or the user can manually check if the risk is generated when the app is running.

    console.log('\n--- VERIFICATION: Traceability Check ---');
    const risks = await prisma.cmrRisk.findMany({
        where: { taskId: taskB.id }
    });

    if (risks.length > 0) {
        console.log(`✅ SUCCESS: Found ${risks.length} RiskRecords for Task B.`);
        risks.forEach(r => {
            console.log(`   - Risk ID: ${r.id}, Type: ${r.type}, Responsible: ${r.responsibleId}`);
        });
    } else {
        console.log('⚠️ RiskRecord for Task B not found yet (Cron might not have run).');
    }

    console.log('\n🏁 Beta Integrity Test script execution finished.');
}

runBetaIntegrityTest()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
