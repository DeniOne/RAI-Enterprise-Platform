import { routeScenario } from './scenarios/scenario-router';
import { prisma } from '../config/prisma';
import { ResolvedIntent } from './intent';
import { mesService } from '../mes/services/mes.service';

async function runTests() {
    console.log('--- Starting Sprint 11 Verification Tests (Navigator v2) ---');

    const testUserId = 'test-user-sprint-11';
    const testManagerId = 'test-manager-sprint-11';

    // 1. Setup Data
    // Cleanup dependents first to avoid FK errors
    await prisma.mentorship.deleteMany({ where: { OR: [{ mentee_id: testUserId }, { mentor_id: testManagerId }] } });
    await prisma.wallet.deleteMany({ where: { user_id: { in: [testUserId, testManagerId] } } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, testManagerId] } } });

    // Create Employee
    await prisma.user.create({
        data: {
            id: testUserId,
            email: 'employee-11@test.com',
            password_hash: 'dummy',
            first_name: 'Employee',
            last_name: 'Eleven',
            wallet: { create: { id: 'w-11', mc_balance: 500, gmc_balance: 0 } }
        }
    });

    // Create Manager
    await prisma.user.create({
        data: {
            id: testManagerId,
            email: 'manager-11@test.com',
            password_hash: 'dummy',
            first_name: 'Manager',
            last_name: 'Eleven'
        }
    });

    // Setup Relation (Mentorship) to test Manager View
    await prisma.mentorship.create({
        data: {
            mentor_id: testManagerId,
            mentee_id: testUserId,
            status: 'ACTIVE'
            // start_date removed: not in schema
        }
    });

    // 2. Test Employee Intent (Read Only Check)
    console.log('\nTest 1: Employee - Show MC Balance (Read Only)');
    const initialWallet = await prisma.wallet.findUnique({ where: { id: 'w-11' } });

    const intentEmp: ResolvedIntent = {
        intentId: 'employee.show_mc_balance',
        confidence: 1,
        slots: {},
        userId: testUserId
    };

    const respEmp = await routeScenario(intentEmp);
    console.log('Response:', respEmp.text.split('\n')[0]);

    const finalWallet = await prisma.wallet.findUnique({ where: { id: 'w-11' } });

    // VERIFY: No changes
    if (initialWallet?.updated_at.getTime() === finalWallet?.updated_at.getTime()) {
        console.log('✅ PASS: No DB writes detected (Read-Only confirmed)');
    } else {
        console.error('❌ FAIL: DB write detected!');
    }

    // VERIFY: Advisory Actions present
    if (respEmp.actions && respEmp.actions.length > 0) {
        console.log('✅ PASS: Advisory actions present');
    } else {
        console.error('❌ FAIL: No advisory actions');
    }

    // 3. Test Manager Intent (Privacy Check)
    console.log('\nTest 2: Manager - Mentee List (Privacy)');

    const intentMgr: ResolvedIntent = {
        intentId: 'manager.mentee_list',
        confidence: 1,
        slots: {},
        userId: testManagerId // Correct Manager
    };

    const respMgr = await routeScenario(intentMgr);
    console.log('Response:', respMgr.text);

    if (respMgr.text.includes('Employee Eleven')) {
        console.log('✅ PASS: Manager sees correct mentee');
    } else {
        console.error('❌ FAIL: Manager did not see mentee');
    }

    // 4. Test Manager Intent (Access Control Mock)
    console.log('\nTest 3: Wrong Manager - Mentee List (Empty)');
    const intentWrong: ResolvedIntent = {
        intentId: 'manager.mentee_list',
        confidence: 1,
        slots: {},
        userId: testUserId // Employee trying to be manager
    };

    const respWrong = await routeScenario(intentWrong);
    if (!respWrong.text.includes('Employee Eleven')) {
        console.log('✅ PASS: Wrong user sees no data (Privacy confirmed)');
    } else {
        console.error('❌ FAIL: Data leak detected!');
    }

    // Cleanup
    await prisma.mentorship.deleteMany({ where: { mentor_id: testManagerId } });
    await prisma.wallet.deleteMany({ where: { user_id: testUserId } });
    await prisma.user.deleteMany({ where: { id: { in: [testUserId, testManagerId] } } });

    console.log('\n--- Sprint 11 Verification Finished ---');
}

runTests().catch(console.error);
