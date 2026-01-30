import { prisma } from '../src/config/prisma';

async function cleanup() {
    const adminId = '5f3fbcf7-9668-42ea-95d7-3027920ead82';
    console.log('Starting cleanup, preserving admin:', adminId);

    try {
        // Find non-admin users to get their IDs and related entity IDs
        const usersToDelete = await prisma.user.findMany({
            where: { id: { not: adminId } },
            include: {
                employee: {
                    include: {
                        PersonalFile: true
                    }
                }
            }
        });

        const userIds = usersToDelete.map(u => u.id);
        const employeeIds = usersToDelete.filter(u => u.employee).map(u => u.employee!.id);
        const personalFileIds = usersToDelete
            .filter(u => u.employee && u.employee.PersonalFile)
            .map(u => u.employee!.PersonalFile!.id);

        console.log(`Found ${userIds.length} users, ${employeeIds.length} employees, ${personalFileIds.length} personal files to delete.`);

        // Delete in reverse order of dependencies
        if (personalFileIds.length > 0) {
            await prisma.laborContract.deleteMany({ where: { personalFileId: { in: personalFileIds } } });
            await prisma.personnelDocument.deleteMany({ where: { personalFileId: { in: personalFileIds } } });
            await prisma.personnelOrder.deleteMany({ where: { personalFileId: { in: personalFileIds } } });
            await prisma.personalFile.deleteMany({ where: { id: { in: personalFileIds } } });
        }

        if (employeeIds.length > 0) {
            await prisma.employeeRole.deleteMany({ where: { employee_id: { in: employeeIds } } });
            await prisma.employee.deleteMany({ where: { id: { in: employeeIds } } });
        }

        await prisma.wallet.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.authSession.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.foundationAuditLog.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.foundationAcceptance.deleteMany({ where: { person_id: { in: userIds } } });
        await prisma.task.deleteMany({ where: { creator_id: { in: userIds } } });
        await prisma.aIFeedback.deleteMany({ where: { userId: { in: userIds } } });
        await prisma.rewardEligibility.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.userParticipationStatus.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.userParticipationRank.deleteMany({ where: { user_id: { in: userIds } } });
        await prisma.participationStatusHistory.deleteMany({ where: { user_id: { in: userIds } } });

        // Clear registration logs
        await prisma.employeeRegistrationRequest.deleteMany({});
        await prisma.registrationStepHistory.deleteMany({});

        const deletedUsers = await prisma.user.deleteMany({
            where: { id: { in: userIds } }
        });

        console.log(`Successfully deleted ${deletedUsers.count} users.`);
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanup();
