"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const employee_registration_service_1 = require("../services/employee-registration.service");
const prisma_1 = require("../config/prisma");
async function debugApprove() {
    const service = employee_registration_service_1.EmployeeRegistrationService.getInstance();
    // Get the first PENDING or REVIEW request
    const requests = await prisma_1.prisma.$queryRaw `
        SELECT id FROM "employee_registration_requests" 
        WHERE status = 'REVIEW'
        LIMIT 1
    `;
    if (requests.length === 0) {
        console.log('No requests to approve.');
        return;
    }
    const regId = requests[0].id;
    console.log(`Attempting to approve request: ${regId}`);
    try {
        // We need an admin user ID for reviewed_by
        const admin = await prisma_1.prisma.user.findFirst({
            where: { role: 'ADMIN' }
        });
        if (!admin) {
            console.error('No admin found to perform approval');
            return;
        }
        await service.approveRegistration(regId, admin.id);
        console.log('SUCCESS: Registration approved manually.');
    }
    catch (error) {
        console.error('--- APPROVAL FAILED ---');
        console.error('Message:', error.message);
        console.error('Stack:', error.stack);
        if (error.code)
            console.error('Prisma Code:', error.code);
        if (error.meta)
            console.error('Prisma Meta:', JSON.stringify(error.meta));
    }
    finally {
        await prisma_1.prisma.$disconnect();
    }
}
debugApprove();
