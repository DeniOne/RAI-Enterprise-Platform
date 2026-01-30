/**
 * Enrollment Controller
 * Handles user-facing course enrollment operations
 */

import { Request, Response } from 'express';
import { enrollmentService } from '../services/enrollment.service';
import { universityService } from '../services/university.service';
import { logger } from '../config/logger';

export class EnrollmentController {
    /**
     * POST /api/university/enrollments
     * Enroll in a course
     */
    async enroll(req: Request, res: Response) {
        try {
            const { courseId, assignedBy } = req.body;
            const userId = (req as any).user.id;

            const enrollment = await enrollmentService.enrollInCourse(userId, courseId, assignedBy);

            res.status(201).json({
                success: true,
                data: enrollment,
            });
        } catch (error: any) {
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
    async getMyEnrollments(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const enrollments = await enrollmentService.getMyCourses(userId);

            res.json({
                success: true,
                data: enrollments,
            });
        } catch (error: any) {
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
    async getEnrollmentById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            const enrollment = await enrollmentService.getEnrollmentById(id);

            // Security check: only own enrollment
            if (enrollment.user_id !== userId && (req as any).user.role !== 'ADMIN') {
                return res.status(403).json({
                    success: false,
                    error: 'Forbidden: Access to other user enrollment is restricted',
                });
            }

            res.json({
                success: true,
                data: enrollment,
            });
        } catch (error: any) {
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
    async withdraw(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user.id;

            await enrollmentService.withdrawFromCourse(userId, id);

            res.json({
                success: true,
                message: 'Successfully withdrawn from the course',
            });
        } catch (error: any) {
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
    async updateProgress(req: Request, res: Response) {
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
}

export const enrollmentController = new EnrollmentController();
