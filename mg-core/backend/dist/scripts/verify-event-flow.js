"use strict";
/**
 * Component 3 Manual Verification Script
 * Simulates COURSE_COMPLETED and PHOTOCOMPANY_RESULT events
 */
Object.defineProperty(exports, "__esModule", { value: true });
const prisma_1 = require("../config/prisma");
const university_event_dispatcher_1 = require("../events/university-event.dispatcher");
const logger_1 = require("../config/logger");
async function verifyEventFlow() {
    logger_1.logger.info('--- Starting Event Flow Verification ---');
    // 1. Ensure test user and course exist
    let user = await prisma_1.prisma.user.findFirst({ where: { email: 'test@example.com' } });
    if (!user) {
        logger_1.logger.info('Creating test user...');
        user = await prisma_1.prisma.user.create({
            data: {
                email: 'test@example.com',
                password_hash: 'hash',
                first_name: 'Test',
                last_name: 'User',
            }
        });
    }
    // Ensure userGrade exists
    let userGrade = await prisma_1.prisma.userGrade.findUnique({ where: { user_id: user.id } });
    if (!userGrade) {
        logger_1.logger.info('Creating user grade...');
        await prisma_1.prisma.userGrade.create({
            data: {
                user_id: user.id,
                current_grade: 'INTERN'
            }
        });
    }
    let course = await prisma_1.prisma.course.findFirst();
    if (!course) {
        logger_1.logger.info('Creating test course...');
        const academy = await prisma_1.prisma.academy.create({ data: { name: 'Test Academy' } });
        course = await prisma_1.prisma.course.create({
            data: {
                title: 'Test Course',
                description: 'Description',
                academy_id: academy.id,
                target_metric: 'OKK',
                expected_effect: 'Improve OKK',
                scope: 'GENERAL',
                recognition_mc: 100
            }
        });
    }
    const userId = user.id;
    // 2. Simulate COURSE_COMPLETED
    logger_1.logger.info(`Simulating COURSE_COMPLETED for user ${userId}`);
    const courseEvent = await prisma_1.prisma.event.create({
        data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'COURSE_COMPLETED',
            source: 'VERIFICATION_SCRIPT',
            subject_id: userId,
            subject_type: 'user',
            payload: {
                course_id: course.id,
                user_id: userId,
                enrollment_id: 'test-enrollment-id',
                academy_id: course.academy_id || '',
                completed_at: new Date(),
                duration_minutes: 45,
                recognition_mc: course.recognition_mc,
                target_metric: course.target_metric,
                expected_effect: course.expected_effect,
            },
        }
    });
    // 3. Simulate PHOTOCOMPANY_RESULT (triggers qualification proposal)
    logger_1.logger.info(`Simulating PHOTOCOMPANY_RESULT for user ${userId}`);
    const photoEvent = await prisma_1.prisma.event.create({
        data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            type: 'PHOTOCOMPANY_RESULT',
            source: 'VERIFICATION_SCRIPT',
            subject_id: userId,
            subject_type: 'user',
            payload: {
                shift_id: 'shift-123',
                user_id: userId,
                role: 'PHOTOGRAPHER',
                okk: 95,
                ck: 80,
                conversion: 75,
                quality: 90,
                retouch_time: 20,
                shift_date: new Date(),
                shift_duration_minutes: 480,
                shiftsCount: 10,
                is_stable: true
            }
        }
    });
    // 4. Run Dispatcher
    logger_1.logger.info('Running dispatcher manually...');
    await university_event_dispatcher_1.universityEventDispatcher.dispatchPending();
    await new Promise(r => setTimeout(r, 1000));
    // 5. Verify results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedCourseEvent = await prisma_1.prisma.event.findUnique({ where: { id: courseEvent.id } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const processedPhotoEvent = await prisma_1.prisma.event.findUnique({ where: { id: photoEvent.id } });
    console.log('--- FINAL VERIFICATION RESULTS ---');
    console.log('Course Event ID:', courseEvent.id, 'Processed:', processedCourseEvent?.processed_at);
    console.log('Photo Event ID:', photoEvent.id, 'Processed:', processedPhotoEvent?.processed_at);
    if (processedCourseEvent?.processed_at && processedPhotoEvent?.processed_at) {
        console.log('STATUS: SUCCESS');
    }
    else {
        console.log('STATUS: FAILURE');
    }
    console.log('--- Verification Complete ---');
}
verifyEventFlow()
    .catch(err => console.error(err))
    .finally(() => process.exit());
