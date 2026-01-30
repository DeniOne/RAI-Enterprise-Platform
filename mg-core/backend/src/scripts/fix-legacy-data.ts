import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('🔧 Starting legacy data fix...');

    // 1. Get default department and location
    const defaultDept = await prisma.department.findFirst({ where: { code: 'D1' } });
    const defaultLoc = await prisma.location.findFirst();

    if (!defaultDept || !defaultLoc) {
        throw new Error('Required seed data (D1 department or any location) missing. Run seed-ofs.ts first.');
    }

    console.log(`Using Default Dept: ${defaultDept.name} (${defaultDept.id})`);
    console.log(`Using Default Loc: ${defaultLoc.name} (${defaultLoc.id})`);

    // 2. Fix EmployeeRegistrationRequests
    const pendingRequests = await prisma.employeeRegistrationRequest.findMany({
        where: {
            status: 'APPROVED',
            OR: [
                { department_id: null },
                { location_id: null }
            ]
        }
    });

    console.log(`Found ${pendingRequests.length} approved registration requests with missing data.`);

    for (const reg of pendingRequests) {
        await prisma.employeeRegistrationRequest.update({
            where: { id: reg.id },
            data: {
                department_id: reg.department_id || defaultDept.id,
                location_id: reg.location_id || defaultLoc.id,
                updated_at: new Date()
            }
        });
        console.log(`✅ Fixed registration request for ${reg.first_name} ${reg.last_name}`);
    }

    // 3. Fix Employee records
    const incompleteEmployees = await prisma.employee.findMany({
        where: {
            department_id: null
        }
    });

    console.log(`Found ${incompleteEmployees.length} employee records with missing department_id.`);

    for (const emp of incompleteEmployees) {
        await prisma.employee.update({
            where: { id: emp.id },
            data: {
                department_id: defaultDept.id
            }
        });
        console.log(`✅ Fixed employee record for employee ID: ${emp.id}`);
    }

    // 4. Update User records (in case they also have department_id field and it's null)
    const incompleteUsers = await prisma.user.findMany({
        where: {
            role: 'EMPLOYEE',
            department_id: null
        }
    });

    for (const user of incompleteUsers) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                department_id: defaultDept.id
            }
        });
        console.log(`✅ Fixed user record for: ${user.email}`);
    }

    console.log('✨ Legacy data fix completed successfully.');
}

fix()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
