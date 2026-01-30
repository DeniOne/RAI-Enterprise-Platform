import { PrismaClient } from '@prisma/client';
import EmployeeRegistrationService from '../services/employee-registration.service';

const prisma = new PrismaClient();

async function verify() {
    console.log('🚀 Starting registration validation verification script...');

    const adminId = '5f3fbcf7-9668-42ea-95d7-3027920ead82'; // From user list or previous check
    const registrationId = '81290508-c1fe-4cd6-90e6-1b53d58c7e23'; // Денис Иванов (Self-reg, REVIEW)

    // 1. Check current state
    const reg = await prisma.employeeRegistrationRequest.findUnique({
        where: { id: registrationId }
    });

    if (!reg) {
        throw new Error(`Registration ${registrationId} not found`);
    }

    console.log(`Checking registration for ${reg.first_name} ${reg.last_name}. Status: ${reg.status}, InvitedBy: ${reg.invited_by || 'NONE'}`);

    // 2. NEGATIVE TEST: Attempt approval without departmentId
    console.log('\n❌ Attempting approval without departmentId (should fail)...');
    try {
        await EmployeeRegistrationService.approveRegistration(registrationId, adminId, {
            locationId: 'bc3bbda8-4efd-4524-b6dd-4c5a6899eb80' // Central Office
        } as any);
        console.error('FAIL: Approval succeeded without departmentId!');
        process.exit(1);
    } catch (error: any) {
        console.log(`✅ Success: Caught expected error: ${error.message}`);
        if (error.message !== 'departmentId and locationId are required for self-registration approval') {
            console.error(`Unexpected error message: ${error.message}`);
            process.exit(1);
        }
    }

    // 3. NEGATIVE TEST: Attempt approval without locationId
    console.log('\n❌ Attempting approval without locationId (should fail)...');
    try {
        await EmployeeRegistrationService.approveRegistration(registrationId, adminId, {
            departmentId: 'd7a1f592-36c1-4b13-912b-3e5f22e8d9c2' // Commercial Department
        } as any);
        console.error('FAIL: Approval succeeded without locationId!');
        process.exit(1);
    } catch (error: any) {
        console.log(`✅ Success: Caught expected error: ${error.message}`);
        if (error.message !== 'departmentId and locationId are required for self-registration approval') {
            console.error(`Unexpected error message: ${error.message}`);
            process.exit(1);
        }
    }

    // 4. POSITIVE TEST: Approve with both fields
    console.log('\n✅ Attempting approval with both fields (should succeed)...');

    // Get a valid department and location first to be sure
    const dept = await prisma.department.findFirst();
    const loc = await prisma.location.findFirst();

    if (!dept || !loc) {
        throw new Error('Seed data missing (department or location)');
    }

    console.log(`Using Dept: ${dept.name}, Loc: ${loc.name}`);

    try {
        await EmployeeRegistrationService.approveRegistration(registrationId, adminId, {
            departmentId: dept.id,
            locationId: loc.id
        });
        console.log('✅ Success: Registration approved successfully!');
    } catch (error: any) {
        console.error(`FAIL: Approval failed with correct data: ${error.message}`);
        process.exit(1);
    }

    // 5. Final check in DB
    const updatedReg = await prisma.employeeRegistrationRequest.findUnique({
        where: { id: registrationId }
    });

    if (updatedReg?.status === 'APPROVED' && updatedReg.department_id === dept.id && updatedReg.location_id === loc.id) {
        console.log('\n🌟 VERIFICATION COMPLETE: Implementation is correct and robust.');
    } else {
        console.error('FAIL: Database state is incorrect after approval.');
        process.exit(1);
    }
}

verify()
    .catch((e) => {
        console.error('Verification script crashed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
