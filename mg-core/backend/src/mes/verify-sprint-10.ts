import { mesService } from './services/mes.service';
import { prisma } from '../config/prisma';
import { ProductionOrderStatus, QualityResult } from '@prisma/client';
import { SHIFT_CONFIG, PRODUCT_RATES, QUALITY_MODIFIERS } from './config/mes-rates';

async function runTests() {
    console.log('--- Starting Sprint 10 Verification Tests ---');

    const testUserId = 'test-user-sprint-10';

    // Helper to get time inside shift (12:00 today)
    const getShiftTime = () => {
        const d = new Date();
        d.setHours(12, 0, 0, 0);
        return d;
    };

    const validShiftTime = getShiftTime();

    // Cleanup Function
    const cleanup = async () => {
        const orders = await prisma.productionOrder.findMany({
            where: { created_by_id: testUserId },
            select: { id: true }
        });
        const ids = orders.map(o => o.id);

        if (ids.length > 0) {
            await prisma.qualityCheck.deleteMany({ where: { production_order_id: { in: ids } } });
            await prisma.workOrder.deleteMany({ where: { production_order_id: { in: ids } } });
            await prisma.defect.deleteMany({ where: { production_order_id: { in: ids } } }); // Just in case
            await prisma.productionOrder.deleteMany({ where: { id: { in: ids } } });
        }

        await prisma.user.deleteMany({ where: { id: testUserId } });
    };

    try {
        // Initial Cleanup & User Setup
        await cleanup();
        await prisma.user.upsert({
            where: { id: testUserId },
            update: {},
            create: {
                id: testUserId,
                email: 'test-sprint-10@matrix.gin',
                password_hash: 'dummy',
                first_name: 'Test',
                last_name: 'User'
            }
        });

        /**
         * Test 1: Quality Penalty
         */
        console.log('\nTest 1: Quality Penalty (FAIL)');

        // Order 1: PASS
        await prisma.productionOrder.create({
            data: {
                created_by_id: testUserId,
                product_type: 'PHOTO_SESSION',
                source_type: 'MANUAL',
                quantity: 1,
                status: ProductionOrderStatus.COMPLETED,
                created_at: validShiftTime,
                quality_checks: {
                    create: {
                        check_type: 'VISUAL',
                        result: QualityResult.PASS,
                        created_by_id: testUserId,
                        created_at: validShiftTime
                    }
                }
            }
        });

        // Order 2: FAIL
        await prisma.productionOrder.create({
            data: {
                created_by_id: testUserId,
                product_type: 'PHOTO_SESSION',
                source_type: 'MANUAL',
                quantity: 1,
                status: ProductionOrderStatus.COMPLETED,
                created_at: validShiftTime,
                quality_checks: {
                    create: {
                        check_type: 'VISUAL',
                        result: QualityResult.FAIL,
                        created_by_id: testUserId,
                        created_at: validShiftTime
                    }
                }
            }
        });

        const progress = await mesService.getMyShiftProgress(testUserId);

        const passRate = PRODUCT_RATES['PHOTO_SESSION'].baseRate + PRODUCT_RATES['PHOTO_SESSION'].saleBonus!;
        const failRate = passRate * QUALITY_MODIFIERS.FAIL;
        const expectedEarnings = passRate + failRate;

        console.log(`Expected Earnings: ${expectedEarnings}, Actual: ${progress.forecastEarnings}`);
        console.log(`Created: ${progress.companiesCreated}, Sold: ${progress.companiesSold}`);

        if (progress.forecastEarnings === expectedEarnings && progress.companiesCreated === 2) {
            console.log('✅ Quality Penalty Test Passed');
        } else {
            console.error('❌ Quality Penalty Test Failed');
        }

        /**
         * Test 2: Shift Scope Boundaries
         */
        console.log('\nTest 2: Shift Scope Boundaries');
        const outsideDate = new Date();
        outsideDate.setHours(SHIFT_CONFIG.START_HOUR - 1, 0, 0, 0); // 07:00 (Outside)

        await prisma.productionOrder.create({
            data: {
                created_by_id: testUserId,
                product_type: 'PHOTO_SESSION',
                source_type: 'MANUAL',
                quantity: 1,
                status: ProductionOrderStatus.COMPLETED,
                created_at: outsideDate
            }
        });

        const progressShift = await mesService.getMyShiftProgress(testUserId);
        // Should still be only the 2 orders from Test 1 (since 3rd is outside)
        if (progressShift.companiesCreated === 2) {
            console.log('✅ Shift Scope Test Passed (Order at 07:00 ignored)');
        } else {
            console.error(`❌ Shift Scope Test Failed. Expected 2, got ${progressShift.companiesCreated}`);
        }

        /**
         * Test 3: Deterministic Forecast
         */
        console.log('\nTest 3: Deterministic Forecast');
        const f1 = await mesService.getEarningsForecast(testUserId);
        const f2 = await mesService.getEarningsForecast(testUserId);

        if (JSON.stringify(f1) === JSON.stringify(f2)) {
            console.log('✅ Deterministic Test Passed');
        } else {
            console.error('❌ Deterministic Test Failed');
        }

    } catch (e) {
        console.error('TEST ERROR:', e);
    } finally {
        // Final Cleanup
        await cleanup();
        console.log('\n--- Verification Finished ---');
    }
}

runTests().catch(console.error);
