
import { PrismaClient, UserRole } from '@prisma/client';
// import { v4 as uuidv4 } from 'uuid'; // Unused

const prisma = new PrismaClient();

const ACTIVE_VERSION = 'v2.2-legacy';

async function main() {
    console.log('🚀 Starting Foundation Backfill Migration...');

    // Parse args
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');
    const trustAdmins = args.includes('--trust-admins');

    if (dryRun) console.log('⚠️  DRY RUN MODE: No changes will be committed.');
    if (trustAdmins) console.log('🛡️  TRUST ADMINS MODE: Administrators will be auto-accepted.');

    const users = await prisma.user.findMany({
        include: { foundation_acceptance: true }
    });

    console.log(`📋 Found ${users.length} users.`);

    let processed = 0;
    let accepted = 0;
    let initialized = 0;
    let skipped = 0;

    for (const user of users) {
        if (user.foundation_acceptance) {
            console.log(`⏩ User ${user.email} already has record. Skipped.`);
            skipped++;
            continue;
        }

        const isAdmin = user.role === 'ADMIN';
        const shouldAccept = trustAdmins && isAdmin;
        const status = shouldAccept ? 'ACCEPTED' : 'NOT_ACCEPTED';

        console.log(`Processing ${user.email} (${user.role}) -> ${status}`);

        if (!dryRun) {
            // 1. Create Acceptance Record
            await prisma.foundationAcceptance.create({
                data: {
                    person_id: user.id,
                    version: ACTIVE_VERSION,
                    decision: status,
                    accepted_at: shouldAccept ? new Date() : undefined,
                    valid_until: null
                }
            });

            // 2. Create Audit Log
            await prisma.foundationAuditLog.create({
                data: {
                    user_id: user.id,
                    event_type: 'MIGRATION_BACKFILL',
                    metadata: {
                        block_id: 'SYSTEM_MIGRATION', // Moved to metadata
                        reason: 'Upgrade to Canon v2.2',
                        migrated_status: status,
                        is_admin_trust: shouldAccept
                    },
                    timestamp: new Date()
                }
            });
        }

        if (shouldAccept) accepted++;
        else initialized++;
        processed++;
    }

    console.log('\n✅ Migration Complete');
    console.log(`   - Processed: ${processed}`);
    console.log(`   - Auto-Accepted: ${accepted}`);
    console.log(`   - Initialized (Locked): ${initialized}`);
    console.log(`   - Skipped (Existing): ${skipped}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
