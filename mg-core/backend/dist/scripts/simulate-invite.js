"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const employee_registration_service_1 = require("../services/employee-registration.service");
const prisma_1 = require("../config/prisma");
/**
 * Simulation script to invite a test employee
 * Usage: ts-node scripts/simulate-invite.ts <telegram_id> <invited_by_user_id>
 */
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error('Usage: ts-node scripts/simulate-invite.ts <telegram_id> <invited_by_user_id>');
        process.exit(1);
    }
    const telegramId = args[0];
    const invitedByUserId = args[1];
    console.log(`[SIMULATION] Inviting test employee with TG ID: ${telegramId}...`);
    try {
        const registrationService = employee_registration_service_1.EmployeeRegistrationService.getInstance();
        // Find a department to assign
        const department = await prisma_1.prisma.department.findFirst();
        if (!department)
            throw new Error('No departments found in DB');
        await registrationService.sendRegistrationInvitation(telegramId, invitedByUserId, department.id);
        console.log('✅ Invitation sent successfully! Check Telegram.');
    }
    catch (error) {
        console.error('❌ Simulation failed:', error);
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
main();
