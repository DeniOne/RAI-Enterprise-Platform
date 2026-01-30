/**
 * Enrollment Service
 * Handles course enrollments and progress tracking
 */


import { prisma } from '../config/prisma';
import { foundationService } from './foundation.service';

export class EnrollmentService {
    /**
     * Enroll user in a course
     */
    async enrollInCourse(userId: string, courseId: string, assignedBy?: string) {
        // Check if course exists and verify required grade
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        if (course.required_grade) {
            const userGrade = await prisma.userGrade.findUnique({
                where: { user_id: userId },
            });

            if (!userGrade) {
                throw new Error('User grade not found');
            }

            const grades: Record<string, number> = {
                'INTERN': 1,
                'SPECIALIST': 2,
                'PROFESSIONAL': 3,
                'EXPERT': 4,
                'MASTER': 5
            };

            const userGradeLevel = grades[userGrade.current_grade] || 0;
            const requiredGradeLevel = grades[course.required_grade] || 0;

            if (userGradeLevel < requiredGradeLevel) {
                throw new Error(`Qualification too low. Required grade: ${course.required_grade}`);
            }
        }

        // CANON v2: Foundation Check
        // CANON v2.2: Foundation Check (Data Source: FoundationAcceptance)
        if (course.type === 'APPLIED') {
            await foundationService.assertFoundationAccessForApplied(userId);
        }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id: userId,
                    course_id: courseId,
                },
            },
        });

        if (existing) {
            if (existing.status === 'ABANDONED') {
                // Reactivate abandonment
                return await prisma.enrollment.update({
                    where: { id: existing.id },
                    data: { status: 'ACTIVE', enrolled_at: new Date(), progress: 0 }
                });
            }
            throw new Error('Already enrolled in this course');
        }

        // Create enrollment
        const enrollment = await prisma.enrollment.create({
            data: {
                user_id: userId,
                course_id: courseId,
                assigned_by: assignedBy,
                status: 'ACTIVE',
            },
        });

        // Create progress tracking for all modules
        const courseModules = await prisma.courseModule.findMany({
            where: { course_id: courseId },
        });

        const progressRecords = courseModules.map((module) => ({
            enrollment_id: enrollment.id,
            module_id: module.id,
            status: 'NOT_STARTED' as const,
        }));

        await prisma.moduleProgress.createMany({
            data: progressRecords,
        });

        return enrollment;
    }

    /**
     * Get user's courses
     */
    async getMyCourses(userId: string) {
        const enrollments = await prisma.enrollment.findMany({
            where: { user_id: userId },
            include: {
                course: {
                    include: {
                        academy: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                enrolled_at: 'desc',
            },
        });

        const active = enrollments
            .filter((e) => e.status === 'ACTIVE')
            .map((e) => this.formatEnrollment(e));

        const completed = enrollments
            .filter((e) => e.status === 'COMPLETED')
            .map((e) => this.formatEnrollment(e));

        const abandoned = enrollments
            .filter((e) => e.status === 'ABANDONED')
            .map((e) => this.formatEnrollment(e));

        return { active, completed, abandoned };
    }

    /**
     * Get enrollment by ID
     */
    async getEnrollmentById(id: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id },
            include: {
                course: {
                    include: {
                        academy: true,
                        modules: {
                            orderBy: { module_order: 'asc' },
                            include: { material: true }
                        }
                    }
                },
                module_progress: {
                    include: { module: true }
                }
            }
        });

        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        return enrollment;
    }

    /**
     * Withdraw from course (abandon)
     */
    async withdrawFromCourse(userId: string, enrollmentId: string) {
        const enrollment = await prisma.enrollment.findFirst({
            where: {
                id: enrollmentId,
                user_id: userId
            }
        });

        if (!enrollment) {
            throw new Error('Enrollment not found or does not belong to user');
        }

        if (enrollment.status === 'COMPLETED') {
            throw new Error('Cannot withdraw from a completed course');
        }

        return await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                status: 'ABANDONED'
            }
        });
    }

    /**
     * Update module progress
     */
    async updateModuleProgress(
        enrollmentId: string,
        moduleId: string,
        status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED',
        score?: number
    ) {
        const progress = await prisma.moduleProgress.findFirst({
            where: {
                enrollment_id: enrollmentId,
                module_id: moduleId,
            },
        });

        if (!progress) {
            throw new Error('Module progress not found');
        }

        const updated = await prisma.moduleProgress.update({
            where: { id: progress.id },
            data: {
                status,
                score,
                started_at: status === 'IN_PROGRESS' && !progress.started_at ? new Date() : progress.started_at,
                completed_at: status === 'COMPLETED' ? new Date() : null,
            },
        });

        // Update enrollment progress
        await this.updateEnrollmentProgress(enrollmentId);

        return updated;
    }

    /**
     * Complete course and emit recognition event
     * 
     * CANON:
     * - Course NEVER changes qualification directly
     * - Course NEVER awards money directly
     * - Only registerRecognition (MC) + event emission
     */
    async completeCourse(userId: string, courseId: string) {
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                user_id_course_id: {
                    user_id: userId,
                    course_id: courseId,
                },
            },
            include: {
                course: true,
            },
        });

        if (!enrollment) {
            throw new Error('Enrollment not found');
        }

        if (enrollment.status === 'COMPLETED') {
            throw new Error('Course already completed');
        }

        // Check if all required modules are completed
        const allModules = await prisma.courseModule.findMany({
            where: { course_id: courseId },
        });

        const progress = await prisma.moduleProgress.findMany({
            where: {
                enrollment_id: enrollment.id,
            },
        });

        const requiredModules = allModules.filter((m) => m.is_required);
        const completedRequired = progress.filter(
            (p) => p.status === 'COMPLETED' && requiredModules.some((rm) => rm.id === p.module_id)
        );

        if (completedRequired.length < requiredModules.length) {
            throw new Error('Not all required modules completed');
        }

        // Update enrollment status
        const completed = await prisma.enrollment.update({
            where: { id: enrollment.id },
            data: {
                status: 'COMPLETED',
                completed_at: new Date(),
                progress: 100,
            },
        });

        // CANON v2.2: Foundation Completion is DECOUPLED from Course Completion.
        // Immersion Blocks are not courses.
        // Logic moved to FoundationService.

        // CANON: Register recognition (NOT direct MC award)
        // Decoupled via RewardService
        await this.registerRecognition(userId, enrollment.course);

        // Emit COURSE_COMPLETED event for other systems
        await prisma.event.create({
            data: {
                type: 'COURSE_COMPLETED',
                source: 'enrollment_service',
                subject_id: userId,
                subject_type: 'user',
                payload: {
                    user_id: userId,
                    course_id: courseId,
                    enrollment_id: enrollment.id,
                    academy_id: enrollment.course.academy_id || '',
                    completed_at: new Date(),
                    duration_minutes: 0,
                    recognition_mc: enrollment.course.recognition_mc,
                    target_metric: enrollment.course.target_metric,
                    expected_effect: enrollment.course.expected_effect,
                },
            },
        });

        // Module 13: Anti-Fraud Detection (AFTER completion, NON-BLOCKING)
        // CANON: Signals do NOT block course completion
        try {
            const { antiFraudDetector } = await import('./anti-fraud-detector.service');
            const { antiFraudSignalWriter } = await import('./anti-fraud-signal-writer.service');

            // Pure detection
            const signals = antiFraudDetector.detectSignals('Course', courseId, {
                userId,
                courseId,
                enrollmentData: { ...enrollment, user: await prisma.user.findUnique({ where: { id: userId }, include: { erp_role: true } }) },
                moduleProgress: progress,
                completionDate: new Date(),
                // Note: PhotoCompany metrics would be fetched separately for production
                // For now, detector handles missing data gracefully
            });

            // Separate persistence
            await antiFraudSignalWriter.append(signals);
        } catch (error) {
            // Log error but DO NOT block completion
            console.error('[EnrollmentService] Anti-fraud detection failed', error);
        }

        // MVP Learning Contour: Send Telegram notification (NON-BLOCKING)
        // Bot Role: notifier (informs about event)
        try {
            const telegramService = (await import('./telegram.service')).default;
            await telegramService.sendCourseCompletedNotification(
                userId,
                enrollment.course.title,
                enrollment.course.recognition_mc
            );
        } catch (error) {
            // Log error but DO NOT block completion
            console.error('[EnrollmentService] Telegram notification failed', error);
        }

        return completed;
    }

    /**
     * Get user's certifications (completed courses)
     */
    async getCertifications(userId: string) {
        const completed = await prisma.enrollment.findMany({
            where: {
                user_id: userId,
                status: 'COMPLETED',
            },
            include: {
                course: {
                    include: {
                        academy: true,
                    },
                },
            },
            orderBy: {
                completed_at: 'desc',
            },
        });

        return completed.map((c) => ({
            id: c.id,
            courseName: c.course.title,
            academyName: c.course.academy?.name || 'Unknown Academy',
            completedAt: c.completed_at,
            rewardMc: c.course.recognition_mc,
        }));
    }

    /**
     * Update enrollment overall progress based on module progress
     */
    private async updateEnrollmentProgress(enrollmentId: string) {
        const allModules = await prisma.moduleProgress.findMany({
            where: { enrollment_id: enrollmentId },
        });

        if (allModules.length === 0) return;

        const completed = allModules.filter((m) => m.status === 'COMPLETED').length;
        const progress = Math.round((completed / allModules.length) * 100);

        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: {
                progress,
                status: progress === 100 ? 'COMPLETED' : 'ACTIVE',
                completed_at: progress === 100 ? new Date() : null,
            },
        });
    }

    /**
     * Format enrollment for API response
     */
    private formatEnrollment(e: any) {
        return {
            id: e.id,
            courseId: e.course_id,
            courseTitle: e.course.title,
            courseDescription: e.course.description,
            academyName: e.course.academy?.name || 'Unknown',
            progress: e.progress,
            status: e.status,
            enrolledAt: e.enrolled_at,
            completedAt: e.completed_at,
            requiredGrade: e.course.required_grade,
            isMandatory: e.course.is_mandatory
        };
    }

    private async registerRecognition(userId: string, course: any) {
        const { rewardService } = require('./reward.service');

        // CANON: Register Eligibility Event (Decoupled Reward Logic)
        // CANON: Course = recognition (MC), NOT money
        if (course.recognition_mc > 0) {
            await rewardService.registerEligibility(
                userId,
                'COURSE_COMPLETED',
                course.id,
                course.recognition_mc
            );
        }

        // NOTE: GMC rewards remain blocked by checkCanon in the RewardEngine
        // or explicitly ignored here per canonical rules.
    }
}

export const enrollmentService = new EnrollmentService();
