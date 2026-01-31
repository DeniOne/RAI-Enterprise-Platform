"use strict";
/**
 * University Controller
 * Handles all Corporate University endpoints
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.universityController = exports.UniversityController = void 0;
const university_service_1 = require("@/services/university.service");
const enrollment_service_1 = require("../services/enrollment.service");
const trainer_service_1 = require("../services/trainer.service");
const logger_1 = require("../config/logger");
const integrity_action_service_1 = require("../services/integrity-action.service");
const quiz_service_1 = require("../services/quiz.service");
class UniversityController {
    /**
     * GET /api/university/academies
     * Get all academies
     */
    async getAcademies(req, res) {
        try {
            const academies = await university_service_1.universityService.getAcademies();
            res.json({
                success: true,
                data: academies,
            });
        }
        catch (error) {
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
    async getAcademyById(req, res) {
        try {
            const { id } = req.params;
            const academy = await university_service_1.universityService.getAcademyById(id);
            res.json({
                success: true,
                data: academy,
            });
        }
        catch (error) {
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
    async createAcademy(req, res) {
        try {
            const academy = await university_service_1.universityService.createAcademy(req.body);
            res.status(201).json({
                success: true,
                data: academy,
            });
        }
        catch (error) {
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
    async getCourses(req, res) {
        try {
            const { academyId, requiredGrade, isMandatory } = req.query;
            const courses = await university_service_1.universityService.getCourses({
                academyId: academyId,
                requiredGrade: requiredGrade,
                isMandatory: isMandatory === 'true',
            });
            res.json({
                success: true,
                data: courses,
            });
        }
        catch (error) {
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
    async getAvailableCourses(req, res) {
        try {
            const userId = req.user.id;
            const courses = await university_service_1.universityService.getAvailableCourses(userId);
            res.json({
                success: true,
                data: courses,
            });
        }
        catch (error) {
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
    async getCourseById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const course = await university_service_1.universityService.getCourseDetails(id, userId);
            res.json({
                success: true,
                data: course,
            });
        }
        catch (error) {
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
    async createCourse(req, res) {
        try {
            // RBAC: Only TRAINER or MANAGER can create courses
            const userRole = req.user.role;
            if (!['TRAINER', 'MANAGER'].includes(userRole)) {
                logger_1.logger.warn('[RBAC] Access denied: createCourse', {
                    userId: req.user.id,
                    role: userRole,
                    action: 'createCourse',
                    resource: 'course'
                });
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Only trainers or managers can create courses',
                });
            }
            const course = await university_service_1.universityService.createCourse(req.body);
            res.status(201).json({
                success: true,
                data: course,
            });
        }
        catch (error) {
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
    async updateCourse(req, res) {
        try {
            const { id } = req.params;
            const userRole = req.user.role;
            const userId = req.user.id;
            // RBAC: Only TRAINER or MANAGER can update courses
            if (!['TRAINER', 'MANAGER'].includes(userRole)) {
                logger_1.logger.warn('[RBAC] Access denied: updateCourse', {
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
                const course = await university_service_1.universityService.getCourseById(id);
                if (course.createdBy !== userId) {
                    logger_1.logger.warn('[RBAC] Access denied: updateCourse (not owner)', {
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
            const updated = await university_service_1.universityService.updateCourse(id, req.body);
            res.json({
                success: true,
                data: updated,
            });
        }
        catch (error) {
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
    async enrollInCourse(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id; // From auth middleware
            const { assignedBy } = req.body;
            // RBAC: Only EMPLOYEE can enroll (self-enrollment)
            const userRole = req.user.role;
            if (userRole !== 'EMPLOYEE') {
                logger_1.logger.warn('[RBAC] Access denied: enrollInCourse', {
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
            const enrollment = await enrollment_service_1.enrollmentService.enrollInCourse(userId, id, assignedBy);
            res.status(201).json({
                success: true,
                data: {
                    enrollmentId: enrollment.id,
                    courseId: enrollment.course_id,
                    progress: enrollment.progress,
                    status: enrollment.status,
                },
            });
        }
        catch (error) {
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
    async getMyCourses(req, res) {
        try {
            const userId = req.user.id;
            // RBAC: User can only view own courses
            // Already enforced by using userId from token
            const courses = await enrollment_service_1.enrollmentService.getMyCourses(userId);
            res.json({
                success: true,
                data: courses,
            });
        }
        catch (error) {
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
    async updateModuleProgress(req, res) {
        try {
            const { id } = req.params;
            const { moduleId, status, score } = req.body;
            const progress = await enrollment_service_1.enrollmentService.updateModuleProgress(id, moduleId, status, score);
            res.json({
                success: true,
                data: progress,
            });
        }
        catch (error) {
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
    async completeCourse(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            // RBAC: Only EMPLOYEE can complete courses
            const userRole = req.user.role;
            if (userRole !== 'EMPLOYEE') {
                logger_1.logger.warn('[RBAC] Access denied: completeCourse', {
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
            const enrollment = await enrollment_service_1.enrollmentService.completeCourse(userId, id);
            res.json({
                success: true,
                data: {
                    message: 'Course completed successfully',
                    enrollment,
                },
            });
        }
        catch (error) {
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
    async getCertifications(req, res) {
        try {
            const userId = req.user.id;
            const certifications = await enrollment_service_1.enrollmentService.getCertifications(userId);
            res.json({
                success: true,
                data: certifications,
            });
        }
        catch (error) {
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
    async getTrainers(req, res) {
        try {
            const { specialty, status } = req.query;
            const trainers = await trainer_service_1.trainerService.getTrainers({
                specialty: specialty,
                status: status,
            });
            res.json({
                success: true,
                data: trainers,
            });
        }
        catch (error) {
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
    async createTrainer(req, res) {
        try {
            const userId = req.user.id;
            const { specialty } = req.body;
            const trainer = await trainer_service_1.trainerService.createTrainerApplication(userId, specialty);
            res.status(201).json({
                success: true,
                data: trainer,
            });
        }
        catch (error) {
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
    async getTrainerDashboard(req, res) {
        try {
            const userId = req.user.id;
            const allTrainers = await trainer_service_1.trainerService.getTrainers();
            const trainer = allTrainers.find(t => t.user_id === userId);
            if (!trainer)
                throw new Error('You are not registered as a trainer');
            const dashboard = await trainer_service_1.trainerService.getTrainerDashboardData(trainer.id);
            res.json({
                success: true,
                data: dashboard,
            });
        }
        catch (error) {
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
    async accreditTrainer(req, res) {
        try {
            const { id } = req.params;
            const { level, weight, expiresAt } = req.body;
            const adminId = req.user.id;
            const accreditation = await trainer_service_1.trainerService.grantAccreditation({
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
        }
        catch (error) {
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
    async startMentorship(req, res) {
        try {
            const { trainerId, traineeId, plan } = req.body;
            const period = await trainer_service_1.trainerService.startMentorship({
                trainerId,
                traineeId,
                plan
            });
            res.status(201).json({
                success: true,
                data: period,
            });
        }
        catch (error) {
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
    async completeMentorship(req, res) {
        try {
            const { id } = req.params;
            const actorId = req.user.id;
            const { status, notes, metrics } = req.body;
            const result = await trainer_service_1.trainerService.completeMentorship({
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
        }
        catch (error) {
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
    async getQuiz(req, res) {
        try {
            const { materialId } = req.params;
            const quiz = await quiz_service_1.quizService.getQuiz(materialId);
            res.json({
                success: true,
                data: quiz,
            });
        }
        catch (error) {
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
    async submitQuizAttempt(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const { answers, enrollmentId } = req.body;
            const ipAddress = req.ip || '0.0.0.0';
            const userAgent = req.get('User-Agent') || 'unknown';
            const result = await quiz_service_1.quizService.submitAttempt({
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
        }
        catch (error) {
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
    async getSecuritySignals(req, res) {
        try {
            const signals = await integrity_action_service_1.integrityActionService.getSecuritySignals();
            res.json({
                success: true,
                data: signals,
            });
        }
        catch (error) {
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
    async validateSignal(req, res) {
        try {
            const { id } = req.params;
            const { comment } = req.body;
            const actorId = req.user.id;
            if (!comment)
                throw new Error('Comment is mandatory for validation');
            const signal = await integrity_action_service_1.integrityActionService.validateSignal(id, comment, actorId);
            res.json({
                success: true,
                data: signal,
            });
        }
        catch (error) {
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
    async invalidateCertification(req, res) {
        try {
            const { id } = req.params;
            const { reason, evidenceLinks } = req.body;
            const actorId = req.user.id;
            if (!reason)
                throw new Error('Reason is mandatory for invalidation');
            const updated = await integrity_action_service_1.integrityActionService.invalidateCertification({
                enrollmentId: id,
                reason,
                evidenceLinks: evidenceLinks || [],
                actorId
            });
            res.json({
                success: true,
                data: updated,
            });
        }
        catch (error) {
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
    async getAnalyticsOverview(req, res) {
        try {
            const overview = await university_service_1.universityService.getAnalyticsOverview();
            res.json({
                success: true,
                data: overview,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }
}
exports.UniversityController = UniversityController;
exports.universityController = new UniversityController();
