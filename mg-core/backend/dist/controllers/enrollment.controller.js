"use strict";
/**
 * Enrollment Controller
 * Handles user-facing course enrollment operations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollmentController = exports.EnrollmentController = void 0;
const enrollment_service_1 = require("@/services/enrollment.service");
class EnrollmentController {
    /**
     * POST /api/university/enrollments
     * Enroll in a course
     */
    async enroll(req, res) {
        try {
            const { courseId, assignedBy } = req.body;
            const userId = req.user.id;
            const enrollment = await enrollment_service_1.enrollmentService.enrollInCourse(userId, courseId, assignedBy);
            res.status(201).json({
                success: true,
                data: enrollment,
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
     * GET /api/university/enrollments/my
     * Get my enrolled courses
     */
    async getMyEnrollments(req, res) {
        try {
            const userId = req.user.id;
            const enrollments = await enrollment_service_1.enrollmentService.getMyCourses(userId);
            res.json({
                success: true,
                data: enrollments,
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
     * GET /api/university/enrollments/:id
     * Get detailed enrollment info
     */
    async getEnrollmentById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const enrollment = await enrollment_service_1.enrollmentService.getEnrollmentById(id);
            // Security check: only own enrollment
            if (enrollment.user_id !== userId && req.user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Access to other user enrollment is restricted',
                });
            }
            res.json({
                success: true,
                data: enrollment,
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
     * DELETE /api/university/enrollments/:id
     * Withdraw from course
     */
    async withdraw(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            await enrollment_service_1.enrollmentService.withdrawFromCourse(userId, id);
            res.json({
                success: true,
                message: 'Successfully withdrawn from the course',
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
     * PUT /api/university/enrollments/:id/progress
     * Update module progress
     */
    async updateProgress(req, res) {
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
}
exports.EnrollmentController = EnrollmentController;
exports.enrollmentController = new EnrollmentController();
