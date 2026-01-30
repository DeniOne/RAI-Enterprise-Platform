
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    try {
        console.log('--- FIXING USER FOUNDATION STATUS ---');

        // 1. Get current logged in user (or all active users)
        const users = await prisma.user.findMany({
            where: { status: 'ACTIVE' }
        });

        for (const user of users) {
            console.log(`Updating user ${user.email}...`);
            // Update User table
            await prisma.user.update({
                where: { id: user.id },
                data: { foundation_status: 'ACCEPTED' } as any
            });

            // Ensure record in FoundationAcceptance exists
            await prisma.foundationAcceptance.upsert({
                where: { person_id: user.id },
                create: {
                    person_id: user.id,
                    decision: 'ACCEPTED',
                    version: '2.2', // Matching backend constant
                    accepted_at: new Date()
                },
                update: {
                    decision: 'ACCEPTED',
                    version: '2.2',
                    accepted_at: new Date()
                }
            });
        }

        console.log('DONE. Foundation statuses updated to ACCEPTED.');

    } catch (error: any) {
        console.error('FIX ERROR:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

fix();
