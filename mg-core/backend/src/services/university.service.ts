/**
 * University Service
 * Module 13: Corporate University
 * Handles Corporate University module business logic
 * 
 * CANON:
 * - Course recommendations based on PhotoCompany metrics ONLY
 * - Dashboard visibility by qualification level
 * - Course ≠ money, only recognition
 */

import { prisma } from '../config/prisma';
import { foundationService } from './foundation.service';
import { FOUNDATION_VERSION } from '../config/foundation.constants';
import { CourseGrade, TargetMetric, CourseScope } from '@prisma/client';

interface VisibilityConfig {
    nextStep: boolean;
    metrics: boolean;
    trends: boolean;
    compare: boolean;
    system?: boolean;
}

export class UniversityService {
    /**
     * Get all academies
     */
    async getAcademies() {
        const academies = await prisma.academy.findMany({
            where: { is_active: true },
            include: {
                _count: {
                    select: {
                        courses: true,
                        skills: true,
                    },
                },
            },
        });

        return academies.map((academy) => ({
            id: academy.id,
            name: academy.name,
            description: academy.description,
            iconUrl: academy.icon_url,
            isActive: academy.is_active,
            coursesCount: academy._count.courses,
            skillsCount: academy._count.skills,
        }));
    }

    /**
     * Get academy by ID with courses
     */
    async getAcademyById(id: string) {
        const academy = await prisma.academy.findUnique({
            where: { id },
            include: {
                courses: {
                    where: { is_active: true },
                    include: {
                        _count: {
                            select: {
                                modules: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        skills: true,
                    },
                },
            },
        });

        if (!academy) {
            throw new Error('Academy not found');
        }

        return {
            id: academy.id,
            name: academy.name,
            description: academy.description,
            iconUrl: academy.icon_url,
            isActive: academy.is_active,
            coursesCount: academy.courses.length,
            skillsCount: academy._count.skills,
            courses: academy.courses.map((course) => ({
                id: course.id,
                title: course.title,
                description: course.description,
                targetMetric: course.target_metric,
                expectedEffect: course.expected_effect,
                scope: course.scope,
                requiredGrade: course.required_grade,
                recognitionMC: course.recognition_mc,
                rewardGMC: course.reward_gmc,
                isMandatory: course.is_mandatory,
                modulesCount: course._count.modules,
            })),
        };
    }

    /**
     * Create new academy
     */
    async createAcademy(data: { name: string; description?: string; icon_url?: string }) {
        return await prisma.academy.create({
            data: {
                name: data.name,
                description: data.description,
                icon_url: data.icon_url,
            },
        });
    }

    /**
     * Update academy
     */
    async updateAcademy(
        id: string,
        data: { name?: string; description?: string; icon_url?: string; is_active?: boolean }
    ) {
        return await prisma.academy.update({
            where: { id },
            data,
        });
    }

    /**
     * Get all courses with filters
     */
    async getCourses(filters?: {
        academyId?: string;
        requiredGrade?: string;
        isMandatory?: boolean;
    }) {
        const where: any = { is_active: true };

        if (filters?.academyId) {
            where.academy_id = filters.academyId;
        }

        if (filters?.requiredGrade) {
            where.required_grade = filters.requiredGrade;
        }

        if (filters?.isMandatory !== undefined) {
            where.is_mandatory = filters.isMandatory;
        }

        const courses = await prisma.course.findMany({
            where,
            include: {
                academy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        modules: true,
                    },
                },
            },
        });

        return courses.map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            academyId: course.academy?.id,
            academyName: course.academy?.name,
            targetMetric: course.target_metric,
            expectedEffect: course.expected_effect,
            scope: course.scope,
            requiredGrade: course.required_grade,
            recognitionMC: course.recognition_mc,
            rewardGMC: course.reward_gmc,
            isMandatory: course.is_mandatory,
            isActive: course.is_active,
            modulesCount: course._count.modules,
        }));
    }

    /**
     * Get available courses for user based on qualification grade
     * 
     * CANON: User see courses of their grade and below
     */
    async getAvailableCourses(userId: string) {
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

        // Get all active courses
        const courses = await prisma.course.findMany({
            where: { is_active: true },
            include: {
                academy: {
                    select: {
                        name: true,
                    },
                },
                _count: {
                    select: {
                        modules: true,
                    },
                },
            },
        });

        // CANON v2.2: Foundation Visibility Guard
        // If not accepted, user sees NO Applied courses.
        const acceptance = await prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });

        const isAccepted = acceptance?.decision === 'ACCEPTED';
        // TODO: Version check if needed

        // Filter by grade level AND Foundation status
        return courses
            .filter((course) => {
                // Foundation Filter: Hide APPLIED if not accepted
                if (course.type === 'APPLIED' && !isAccepted) {
                    return false;
                }

                const requiredGradeLevel = grades[course.required_grade as string] || 0;
                return requiredGradeLevel <= userGradeLevel;
            })
            .map((course) => {
                // CANON v2.2: Add UX hint about locking
                let isLocked = false;
                let lockReason: string | null = null;

                if (course.type === 'APPLIED') {
                    const hasAccess = acceptance?.decision === 'ACCEPTED' && acceptance?.version === FOUNDATION_VERSION;
                    if (!hasAccess) {
                        isLocked = true;
                        lockReason = 'FOUNDATION_REQUIRED';
                    }
                }

                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    academyName: course.academy?.name,
                    requiredGrade: course.required_grade,
                    recognitionMC: course.recognition_mc,
                    isMandatory: course.is_mandatory,
                    modulesCount: course._count.modules,
                    isLocked,
                    lockReason,
                };
            });
    }

    /**
     * Get course by ID with modules
     */
    async getCourseById(id: string) {
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                academy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                modules: {
                    orderBy: {
                        module_order: 'asc',
                    },
                    include: {
                        material: {
                            select: {
                                id: true,
                                type: true,
                                title: true,
                                duration_minutes: true,
                            },
                        },
                    },
                },
            },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        const totalDuration = course.modules.reduce(
            (sum, module) => sum + (module.material?.duration_minutes || 0),
            0
        );

        return {
            id: course.id,
            title: course.title,
            description: course.description,
            academy: course.academy,
            targetMetric: course.target_metric,
            expectedEffect: course.expected_effect,
            scope: course.scope,
            modules: course.modules.map((module) => ({
                id: module.id,
                order: module.module_order,
                material: module.material,
                isRequired: module.is_required,
            })),
            requiredGrade: course.required_grade,
            recognitionMC: course.recognition_mc,
            rewardGMC: course.reward_gmc,
            isMandatory: course.is_mandatory,
            type: course.type, // Added for Canon v2.2 gating
            createdBy: course.created_by,
            totalDuration,
        };
    }

    async getCourseDetails(id: string, userId?: string) {
        const courseDetails = await this.getCourseById(id);

        let isLocked = false;
        let lockReason: string | null = null;

        if (courseDetails.type === 'APPLIED' && userId) {
            const acceptance = await prisma.foundationAcceptance.findUnique({
                where: { person_id: userId }
            });

            isLocked = !acceptance || acceptance.decision !== 'ACCEPTED' || acceptance.version !== FOUNDATION_VERSION;
            lockReason = isLocked ? 'FOUNDATION_REQUIRED' : null;
        }

        return {
            ...courseDetails,
            isLocked,
            lockReason
        };
    }

    /**
     * Create new course
     */
    async createCourse(data: {
        title: string;
        description?: string;
        academyId?: string;
        requiredGrade?: string;
        rewardMC?: number;
        rewardGMC?: number;
        isMandatory?: boolean;
    }) {
        return await prisma.course.create({
            data: {
                title: data.title,
                description: data.description,
                academy_id: data.academyId,
                required_grade: data.requiredGrade as any,
                recognition_mc: data.rewardMC || 0,
                reward_gmc: data.rewardGMC || 0,
                is_mandatory: data.isMandatory || false,
                expected_effect: 'Улучшение показателей',
                scope: 'GENERAL',
                target_metric: 'QUALITY',
            },
        });
    }

    /**
     * Update course
     */
    async updateCourse(
        id: string,
        data: {
            title?: string;
            description?: string;
            requiredGrade?: string;
            rewardMC?: number;
            rewardGMC?: number;
            isMandatory?: boolean;
            isActive?: boolean;
        }
    ) {
        return await prisma.course.update({
            where: { id },
            data: {
                title: data.title,
                description: data.description,
                required_grade: data.requiredGrade as any,
                recognition_mc: data.rewardMC,
                reward_gmc: data.rewardGMC,
                is_mandatory: data.isMandatory,
                is_active: data.isActive,
            },
        });
    }

    /**
     * Add module to course
     */
    async addCourseModule(
        courseId: string,
        data: {
            materialId: string;
            order: number;
            isRequired?: boolean;
        }
    ) {
        return await prisma.courseModule.create({
            data: {
                course_id: courseId,
                material_id: data.materialId,
                module_order: data.order,
                is_required: data.isRequired ?? true,
            },
        });
    }

    /**
     * Get student dashboard with visibility based on qualification level
     * 
     * CANON: Visibility increases with qualification
     */
    async getStudentDashboard(userId: string) {
        const userGrade = await prisma.userGrade.findUnique({
            where: { user_id: userId },
        });

        if (!userGrade) {
            throw new Error('User grade not found');
        }

        const currentGrade = userGrade.current_grade;
        const visibility = this.getVisibilityLevel(currentGrade);

        const enrollments = await prisma.enrollment.findMany({
            where: {
                user_id: userId,
            },
            include: {
                course: true,
            },
        });

        const recommendations = await this.getRecommendedCourses(userId);
        const progressToNext = await this.calculateProgressToNext(userId);

        return {
            currentGrade,
            visibility,
            enrollments: enrollments.map((e) => ({
                id: e.id,
                courseId: e.course_id,
                courseTitle: e.course.title,
                progress: e.progress,
                status: e.status,
                enrolledAt: e.enrolled_at,
            })),
            activeCourses: enrollments
                .filter(e => e.status === 'ACTIVE')
                .map((e) => ({
                    id: e.id,
                    courseId: e.course_id,
                    courseTitle: e.course.title,
                    progress: e.progress,
                    enrolledAt: e.enrolled_at,
                })),
            recommendedCourses: recommendations,
            progressToNext,
        };
    }

    /**
     * Get visibility level based on qualification grade
     * 
     * CANON: Higher qualification → more visibility
     */
    getVisibilityLevel(grade: CourseGrade): VisibilityConfig {
        const visibilityMap: Record<CourseGrade, VisibilityConfig> = {
            INTERN: {
                nextStep: true,
                metrics: false,
                trends: false,
                compare: false,
            },
            SPECIALIST: {
                nextStep: true,
                metrics: true,
                trends: false,
                compare: false,
            },
            PROFESSIONAL: {
                nextStep: true,
                metrics: true,
                trends: true,
                compare: false,
            },
            EXPERT: {
                nextStep: true,
                metrics: true,
                trends: true,
                compare: true,
            },
            MASTER: {
                nextStep: true,
                metrics: true,
                trends: true,
                compare: true,
                system: true,
            },
        };

        return visibilityMap[grade];
    }

    /**
     * Get recommended courses based on PhotoCompany metrics
     * 
     * CANON: Source = PhotoCompany metrics (last N shifts)
     * NOT: grades, test scores, wishes
     */
    async getRecommendedCourses(userId: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                employee: true,
            },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // CANON v2.2: Foundation Check for UX
        const acceptance = await prisma.foundationAcceptance.findUnique({
            where: { person_id: userId }
        });

        const hasAccess = acceptance?.decision === 'ACCEPTED' && acceptance?.version === FOUNDATION_VERSION;

        // TODO: Integrate with PhotoCompany service to get real metrics
        const photocompanyMetrics = {
            okk: 75,
            ck: 65,
            conversion: 55,
            quality: 85,
            retouchTime: 45,
        };

        const weakMetrics: TargetMetric[] = [];
        if (photocompanyMetrics.okk < 80) weakMetrics.push('OKK');
        if (photocompanyMetrics.ck < 70) weakMetrics.push('CK');
        if (photocompanyMetrics.conversion < 60) weakMetrics.push('CONVERSION');
        if (photocompanyMetrics.quality < 90) weakMetrics.push('QUALITY');
        if (photocompanyMetrics.retouchTime > 40) weakMetrics.push('RETOUCH_TIME');

        if (weakMetrics.length === 0) {
            return [];
        }

        const courses = await prisma.course.findMany({
            where: {
                target_metric: {
                    in: weakMetrics,
                },
                is_active: true,
            },
            include: {
                academy: {
                    select: {
                        name: true,
                    },
                },
            },
            take: 5,
        });

        return courses.map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            academyName: course.academy?.name,
            targetMetric: course.target_metric,
            expectedEffect: course.expected_effect,
            scope: course.scope,
            recognitionMC: course.recognition_mc,
            reason: `Улучшение метрики: ${course.target_metric}`,
        }));
    }

    /**
     * Calculate progress to next qualification level
     */
    async calculateProgressToNext(userId: string) {
        const userGrade = await prisma.userGrade.findUnique({
            where: { user_id: userId },
        });

        if (!userGrade) {
            throw new Error('User grade not found');
        }

        const currentGrade = userGrade.current_grade;

        const progression: CourseGrade[] = [
            'INTERN',
            'SPECIALIST',
            'PROFESSIONAL',
            'EXPERT',
            'MASTER',
        ];

        const currentIndex = progression.indexOf(currentGrade);
        if (currentIndex === -1 || currentIndex === progression.length - 1) {
            return {
                currentGrade,
                nextGrade: null,
                progress: 100,
                message: 'Максимальный уровень достигнут',
            };
        }

        const nextGrade = progression[currentIndex + 1];

        // TODO: Calculate real progress based on PhotoCompany metrics
        return {
            currentGrade,
            nextGrade,
            progress: 65,
            message: `Продолжайте улучшать метрики для достижения уровня ${nextGrade}`,
        };
    }

    /**
     * MVP Learning Contour: Get learning status for Telegram Bot
     * 
     * Returns simplified dashboard for Telegram display
     */
    async getMyLearningStatus(userId: string) {
        const dashboard = await this.getStudentDashboard(userId);

        return {
            activeCourses: dashboard.activeCourses,
            recommendations: dashboard.recommendedCourses,
            currentGrade: dashboard.currentGrade,
        };
    }

    /**
     * MVP Learning Contour: Explain why course was recommended
     * 
     * CANONICAL: Every recommendation MUST be traceable to PhotoCompany metric
     * 
     * Returns PhotoCompany metric that triggered recommendation
     */
    async explainRecommendation(courseId: string, userId: string) {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            throw new Error('Course not found');
        }

        // TODO: Integrate with PhotoCompany service to get real metrics
        const photocompanyMetrics = {
            okk: 75,
            ck: 65,
            conversion: 55,
            quality: 85,
            retouchTime: 45,
        };

        // PhotoCompany metric thresholds (CANONICAL)
        const thresholds = {
            OKK: { threshold: 80, current: photocompanyMetrics.okk },
            CK: { threshold: 70, current: photocompanyMetrics.ck },
            CONVERSION: { threshold: 60, current: photocompanyMetrics.conversion },
            QUALITY: { threshold: 90, current: photocompanyMetrics.quality },
            RETOUCH_TIME: { threshold: 40, current: photocompanyMetrics.retouchTime },
        };

        const targetMetric = course.target_metric;
        const metricData = thresholds[targetMetric as keyof typeof thresholds];

        if (!metricData) {
            return {
                courseId,
                targetMetric,
                reason: 'Метрика не найдена',
            };
        }

        return {
            courseId,
            courseName: course.title,
            targetMetric,
            currentValue: metricData.current,
            threshold: metricData.threshold,
            reason: `${targetMetric}: ${metricData.current} < ${metricData.threshold}`,
            expectedImprovement: course.expected_effect,
        };
    }

    /**
     * Get University Analytics Overview
     * CANON: Read-only aggregates
     */
    async getAnalyticsOverview() {
        const [
            academiesCount,
            coursesCount,
            totalEnrollments,
            completedEnrollments,
            activeMentorships,
            securitySignalsCount
        ] = await Promise.all([
            prisma.academy.count({ where: { is_active: true } }),
            prisma.course.count({ where: { is_active: true } }),
            prisma.enrollment.count(),
            prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
            prisma.mentorshipPeriod.count({ where: { status: 'ACTIVE' } }),
            prisma.antiFraudSignal.count()
        ]);

        return {
            infrastructure: {
                academies: academiesCount,
                courses: coursesCount,
            },
            learning: {
                totalEnrollments,
                completedEnrollments,
                completionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
            },
            mentorship: {
                activePeriods: activeMentorships,
            },
            security: {
                activeSignals: securitySignalsCount,
            },
            timestamp: new Date()
        };
    }
}

export const universityService = new UniversityService();

