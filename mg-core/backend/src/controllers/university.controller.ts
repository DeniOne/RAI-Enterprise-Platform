/**
 * University Controller
 * Handles all Corporate University endpoints
 */

import { Request, Response } from 'express';
import { universityService } from '../services/university.service';
import { enrollmentService } from '../services/enrollment.service';
import { enrollmentController } from './enrollment.controller';
import { trainerService } from '../services/trainer.service';
import { requireRole } from '../middleware/roles.middleware';
import { logger } from '../config/logger';
import { integrityActionService } from '../services/integrity-action.service';
import { quizService } from '../services/quiz.service';

export class UniversityController {
    /**
     * GET /api/university/academies
     * Get all academies
     */
    async getAcademies(req: Request, res: Response) {
        try {
            const academies = await universityService.getAcademies();
            res.json({
                success: true,
                data: academies,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/academies/:id
     * Get academy by ID with courses
     */
    async getAcademyById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const academy = await universityService.getAcademyById(id);
            res.json({
                success: true,
                data: academy,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/academies
     * Create new academy (Admin only)
     */
    async createAcademy(req: Request, res: Response) {
        try {
            const academy = await universityService.createAcademy(req.body);
            res.status(201).json({
                success: true,
                data: academy,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/courses
     * Get all courses with filters
     */
    async getCourses(req: Request, res: Response) {
        try {
            const { academyId, requiredGrade, isMandatory } = req.query;
            const courses = await universityService.getCourses({
                academyId: academyId as string,
                requiredGrade: requiredGrade as string,
                isMandatory: isMandatory === 'true',
            });
            res.json({
                success: true,
                data: courses,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/courses/available
     * Get available courses for current user (filtered by grade)
     */
    async getAvailableCourses(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const courses = await universityService.getAvailableCourses(userId);
            res.json({
                success: true,
                data: courses,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/courses/:id
     * Get course by ID with modules
     */
    async getCourseById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id;
            const course = await universityService.getCourseDetails(id, userId);
            res.json({
                success: true,
                data: course,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/courses
     * Create new course
     * RBAC: TRAINER or MANAGER only
     */
    async createCourse(req: Request, res: Response) {
        try {
            // RBAC: Only TRAINER or MANAGER can create courses
            const userRole = (req as any).user.role;
            if (!['TRAINER', 'MANAGER'].includes(userRole)) {
                logger.warn('[RBAC] Access denied: createCourse', {
                    userId: (req as any).user.id,
                    role: userRole,
                    action: 'createCourse',
                    resource: 'course'
                });
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Only trainers or managers can create courses',
                });
            }

            const course = await universityService.createCourse(req.body);
            res.status(201).json({
                success: true,
                data: course,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/university/courses/:id
     * Update course
     * RBAC: TRAINER (own courses only) or MANAGER
     */
    async updateCourse(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userRole = (req as any).user.role;
            const userId = (req as any).user.id;

            // RBAC: Only TRAINER or MANAGER can update courses
            if (!['TRAINER', 'MANAGER'].includes(userRole)) {
                logger.warn('[RBAC] Access denied: updateCourse', {
                    userId,
                    role: userRole,
                    action: 'updateCourse',
                    resource: 'course',
                    courseId: id
                });
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Only trainers or managers can update courses',
                });
            }

            // FIX 1: Trainer ownership check
            if (userRole === 'TRAINER') {
                const course = await universityService.getCourseById(id);
                if (course.createdBy !== userId) {
                    logger.warn('[RBAC] Access denied: updateCourse (not owner)', {
                        userId,
                        role: userRole,
                        action: 'updateCourse',
                        resource: 'course',
                        courseId: id,
                        ownerId: course.createdBy
                    });
                    return res.status(403).json({
                        success: false,
                        error: 'Forbidden: Trainers can only update their own courses',
                    });
                }
            }

            const updated = await universityService.updateCourse(id, req.body);
            res.json({
                success: true,
                data: updated,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/courses/:id/enroll
     * Enroll in a course
     * RBAC: EMPLOYEE only (self-enrollment)
     */
    async enrollInCourse(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id; // From auth middleware
            const { assignedBy } = req.body;

            // RBAC: Only EMPLOYEE can enroll (self-enrollment)
            const userRole = (req as any).user.role;
            if (userRole !== 'EMPLOYEE') {
                logger.warn('[RBAC] Access denied: enrollInCourse', {
                    userId,
                    role: userRole,
                    action: 'enrollInCourse',
                    resource: 'course',
                    courseId: id
                });
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Only employees can enroll in courses',
                });
            }

            const enrollment = await enrollmentService.enrollInCourse(userId, id, assignedBy);

            res.status(201).json({
                success: true,
                data: {
                    enrollmentId: enrollment.id,
                    courseId: enrollment.course_id,
                    progress: enrollment.progress,
                    status: enrollment.status,
                },
            });
        } catch (error: any) {
            // Mapping domain errors to HTTP statuses
            if (error.message.includes('FOUNDATION_REQUIRED') || error.message.includes('FOUNDATION_VERSION_OUTDATED')) {
                return res.status(403).json({
                    success: false,
                    error: error.message,
                    reason: 'FOUNDATION_REQUIRED'
                });
            }

            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/my-courses
     * Get my enrolled courses
     * RBAC: Authenticated users only (self-only)
     */
    async getMyCourses(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            // RBAC: User can only view own courses
            // Already enforced by using userId from token

            const courses = await enrollmentService.getMyCourses(userId);
            res.json({
                success: true,
                data: courses,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * PUT /api/university/enrollments/:id/progress
     * Update module progress
     */
    async updateModuleProgress(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { moduleId, status, score } = req.body;

            const progress = await enrollmentService.updateModuleProgress(id, moduleId, status, score);

            res.json({
                success: true,
                data: progress,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/courses/:id/complete
     * Complete a course
     * RBAC: EMPLOYEE only (self-only)
     */
    async completeCourse(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            // RBAC: Only EMPLOYEE can complete courses
            const userRole = (req as any).user.role;
            if (userRole !== 'EMPLOYEE') {
                logger.warn('[RBAC] Access denied: completeCourse', {
                    userId,
                    role: userRole,
                    action: 'completeCourse',
                    resource: 'course',
                    courseId: id
                });
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Only employees can complete courses',
                });
            }

            const enrollment = await enrollmentService.completeCourse(userId, id);

            res.json({
                success: true,
                data: {
                    message: 'Course completed successfully',
                    enrollment,
                },
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/certifications
     * Get my certifications
     */
    async getCertifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const certifications = await enrollmentService.getCertifications(userId);
            res.json({
                success: true,
                data: certifications,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/trainers
     * Get all trainers with filters
     */
    async getTrainers(req: Request, res: Response) {
        try {
            const { specialty, status } = req.query;
            const trainers = await trainerService.getTrainers({
                specialty: specialty as any,
                status: status as string,
            });
            res.json({
                success: true,
                data: trainers,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/trainers
     * Apply to become a trainer
     */
    async createTrainer(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { specialty } = req.body;
            const trainer = await trainerService.createTrainerApplication(userId, specialty);
            res.status(201).json({
                success: true,
                data: trainer,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/trainers/dashboard
     * Get trainer dashboard data
     */
    async getTrainerDashboard(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const allTrainers = await trainerService.getTrainers();
            const trainer = allTrainers.find(t => t.user_id === userId);

            if (!trainer) throw new Error('You are not registered as a trainer');

            const dashboard = await trainerService.getTrainerDashboardData(trainer.id);
            res.json({
                success: true,
                data: dashboard,
            });
        } catch (error: any) {
            res.status(403).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/trainers/:id/accredit
     * Accredit a trainer (Admin/HR only)
     */
    async accreditTrainer(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { level, weight, expiresAt } = req.body;
            const adminId = (req as any).user.id;

            const accreditation = await trainerService.grantAccreditation({
                trainerId: id,
                level,
                weight: weight || 1.0,
                grantedBy: adminId,
                expiresAt: expiresAt ? new Date(expiresAt) : undefined
            });

            res.json({
                success: true,
                data: accreditation,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/trainers/mentorship
     * Start mentorship period
     */
    async startMentorship(req: Request, res: Response) {
        try {
            const { trainerId, traineeId, plan } = req.body;
            const period = await trainerService.startMentorship({
                trainerId,
                traineeId,
                plan
            });
            res.status(201).json({
                success: true,
                data: period,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/trainers/mentorship/:id/complete
     * Finalize mentorship (COMPLETED/FAILED)
     */
    async completeMentorship(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const actorId = (req as any).user.id;
            const { status, notes, metrics } = req.body;

            const result = await trainerService.completeMentorship({
                periodId: id,
                status,
                notes,
                metrics,
                actorId
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/quizzes/:materialId
     * Get quiz structure for a material
     */
    async getQuiz(req: Request, res: Response) {
        try {
            const { materialId } = req.params;
            const quiz = await quizService.getQuiz(materialId);
            res.json({
                success: true,
                data: quiz,
            });
        } catch (error: any) {
            res.status(404).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/quizzes/:id/submit
     * Submit quiz attempt
     */
    async submitQuizAttempt(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;
            const { answers, enrollmentId } = req.body;
            const ipAddress = req.ip || '0.0.0.0';
            const userAgent = req.get('User-Agent') || 'unknown';

            const result = await quizService.submitAttempt({
                userId,
                quizId: id,
                enrollmentId,
                answers,
                ipAddress,
                userAgent
            });

            res.status(201).json({
                success: true,
                data: result,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/security/signals
     * Get anti-fraud signals (Admin/HR only)
     */
    async getSecuritySignals(req: Request, res: Response) {
        try {
            const signals = await integrityActionService.getSecuritySignals();
            res.json({
                success: true,
                data: signals,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/security/signals/:id/validate
     * Validate a signal (Admin/HR only)
     */
    async validateSignal(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const actorId = (req as any).user.id;

            if (!comment) throw new Error('Comment is mandatory for validation');

            const signal = await integrityActionService.validateSignal(id, comment, actorId);
            res.json({
                success: true,
                data: signal,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * POST /api/university/security/certifications/:id/invalidate
     * Invalidate a certification (Admin/HR only)
     */
    async invalidateCertification(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { reason, evidenceLinks } = req.body;
            const actorId = (req as any).user.id;

            if (!reason) throw new Error('Reason is mandatory for invalidation');

            const updated = await integrityActionService.invalidateCertification({
                enrollmentId: id,
                reason,
                evidenceLinks: evidenceLinks || [],
                actorId
            });

            res.json({
                success: true,
                data: updated,
            });
        } catch (error: any) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        }
    }

    /**
     * GET /api/university/analytics/overview
     * Get university analytics overview (Admin/HR only)
     */
    async getAnalyticsOverview(req: Request, res: Response) {
        try {
            const overview = await universityService.getAnalyticsOverview();
            res.json({
                success: true,
                data: overview,
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}

export const universityController = new UniversityController();
