/**
 * University Routes
 * Routes for Corporate University module
 */

import { Router } from 'express';
import { universityController } from '../controllers/university.controller';
import { enrollmentController } from '../controllers/enrollment.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/roles.middleware';
import { foundationMiddleware } from '../middleware/foundation.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// CANON v2.2: HARD BLOCK for all Applied University features
// Foundational Immersion flows must be in a separate router or explicitly excluded
router.use(foundationMiddleware);

// ===== Academy Routes =====

/**
 * GET /api/university/academies
 * Get all academies
 */
router.get('/academies', universityController.getAcademies.bind(universityController));

/**
 * GET /api/university/academies/:id
 * Get academy by ID with courses
 */
router.get('/academies/:id', universityController.getAcademyById.bind(universityController));

/**
 * POST /api/university/academies
 * Create new academy (Admin only)
 */
router.post(
    '/academies',
    requireRole(['ADMIN']),
    universityController.createAcademy.bind(universityController)
);

// ===== Course Routes =====

/**
 * GET /api/university/courses/available
 * Get available courses for current user (filtered by grade)
 */
router.get('/courses/available', universityController.getAvailableCourses.bind(universityController));

/**
 * GET /api/university/courses
 * Get all courses with filters
 */
router.get('/courses', universityController.getCourses.bind(universityController));

/**
 * GET /api/university/courses/:id
 * Get course by ID with modules
 */
router.get('/courses/:id', universityController.getCourseById.bind(universityController));

/**
 * POST /api/university/courses
 * Create new course (Admin only)
 */
router.post(
    '/courses',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.createCourse.bind(universityController)
);

/**
 * POST /api/university/courses/:id/enroll
 * Enroll in a course
 */
router.post('/courses/:id/enroll', universityController.enrollInCourse.bind(universityController));

/**
 * POST /api/university/courses/:id/complete
 * Complete a course
 */
router.post('/courses/:id/complete', universityController.completeCourse.bind(universityController));

// ===== Enrollment Routes =====

/**
 * GET /api/university/my-courses
 * Get my enrolled courses (legacy)
 */
router.get('/my-courses', enrollmentController.getMyEnrollments.bind(enrollmentController));

// ===== Enrollment Routes =====

/**
 * POST /api/university/enrollments
 * Enroll in a course
 */
router.post('/enrollments', enrollmentController.enroll.bind(enrollmentController));

/**
 * GET /api/university/enrollments/my
 * Get my enrolled courses
 */
router.get('/enrollments/my', enrollmentController.getMyEnrollments.bind(enrollmentController));

/**
 * GET /api/university/enrollments/:id
 * Get enrollment details
 */
router.get('/enrollments/:id', enrollmentController.getEnrollmentById.bind(enrollmentController));

/**
 * DELETE /api/university/enrollments/:id
 * Withdraw from a course
 */
router.delete('/enrollments/:id', enrollmentController.withdraw.bind(enrollmentController));

/**
 * PUT /api/university/enrollments/:id/progress
 * Update module progress
 */
router.put(
    '/enrollments/:id/progress',
    enrollmentController.updateProgress.bind(enrollmentController)
);

// ===== Certification Routes =====

/**
 * GET /api/university/certifications
 * Get my certifications
 */
router.get('/certifications', universityController.getCertifications.bind(universityController));

// ===== Trainer Routes =====

/**
 * GET /api/university/trainers/dashboard
 * Get trainer personal dashboard (Read-only)
 */
router.get('/trainers/dashboard', universityController.getTrainerDashboard.bind(universityController));

/**
 * POST /api/university/trainers
 * Apply to become a trainer
 */
router.post('/trainers', universityController.createTrainer.bind(universityController));

/**
 * POST /api/university/trainers/:id/accredit
 * Accredit a trainer (Admin/HR only)
 */
router.post(
    '/trainers/:id/accredit',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.accreditTrainer.bind(universityController)
);

/**
 * POST /api/university/trainers/mentorship
 * Start mentorship period (Admin/HR/Dept Head)
 */
router.post(
    '/trainers/mentorship',
    requireRole(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD']),
    universityController.startMentorship.bind(universityController)
);

/**
 * POST /api/university/trainers/mentorship/:id/complete
 * Finalize mentorship (Trainer/Admin only)
 */
router.post(
    '/trainers/mentorship/:id/complete',
    universityController.completeMentorship.bind(universityController)
);

// ===== Quiz Routes =====

/**
 * GET /api/university/quizzes/:materialId
 * Get quiz structure
 */
router.get('/quizzes/:materialId', universityController.getQuiz.bind(universityController));

/**
 * POST /api/university/quizzes/:id/submit
 * Submit quiz attempt
 */
router.post('/quizzes/:id/submit', universityController.submitQuizAttempt.bind(universityController));

// ===== Security & Anti-Fraud Routes =====

/**
 * GET /api/university/security/signals
 * Get anti-fraud signals (Admin/HR only)
 */
router.get(
    '/security/signals',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.getSecuritySignals.bind(universityController)
);

/**
 * POST /api/university/security/signals/:id/validate
 * Validate a signal (Admin/HR only)
 */
router.post(
    '/security/signals/:id/validate',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.validateSignal.bind(universityController)
);

/**
 * POST /api/university/security/certifications/:id/invalidate
 * Invalidate a certification (Admin/HR only)
 */
router.post(
    '/security/certifications/:id/invalidate',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.invalidateCertification.bind(universityController)
);

// ===== Analytics Routes =====

/**
 * GET /api/university/analytics/overview
 * Get university analytics overview (Admin/HR only)
 */
router.get(
    '/analytics/overview',
    requireRole(['ADMIN', 'HR_MANAGER']),
    universityController.getAnalyticsOverview.bind(universityController)
);

export default router;
