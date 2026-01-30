import { PrismaClient, FoundationDecision } from '@prisma/client';
import { FOUNDATION_VERSION } from '../config/foundation.constants';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@photomatrix.ru';
    console.log(`🚀 Force-accepting Foundation for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error('❌ Admin user not found');
        return;
    }

    // 1. Create/Update FoundationAcceptance
    await prisma.foundationAcceptance.upsert({
        where: { person_id: user.id },
        update: {
            decision: FoundationDecision.ACCEPTED,
            version: FOUNDATION_VERSION,
            accepted_at: new Date()
        },
        create: {
            person_id: user.id,
            decision: FoundationDecision.ACCEPTED,
            version: FOUNDATION_VERSION,
            accepted_at: new Date()
        }
    });

    // 2. Update User status
    await prisma.user.update({
        where: { id: user.id },
        data: {
            foundation_status: 'ACCEPTED'
        }
    });

    // 3. Create Audit Log
    await prisma.foundationAuditLog.create({
        data: {
            user_id: user.id,
            event_type: 'FOUNDATION_ACCEPTED',
            foundation_version: FOUNDATION_VERSION,
            metadata: {
                reason: 'FORCE_ADMIN_UNBLOCK',
                timestamp: new Date().toISOString()
            }
        }
    });

    console.log('✅ Admin successfully unblocked and Foundation accepted.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
