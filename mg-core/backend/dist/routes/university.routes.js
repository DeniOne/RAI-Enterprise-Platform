"use strict";
/**
 * University Routes
 * Routes for Corporate University module
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const university_controller_1 = require("../controllers/university.controller");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const roles_middleware_1 = require("../middleware/roles.middleware");
const foundation_middleware_1 = require("../middleware/foundation.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// CANON v2.2: HARD BLOCK for all Applied University features
// Foundational Immersion flows must be in a separate router or explicitly excluded
router.use(foundation_middleware_1.foundationMiddleware);
// ===== Academy Routes =====
/**
 * GET /api/university/academies
 * Get all academies
 */
router.get('/academies', university_controller_1.universityController.getAcademies.bind(university_controller_1.universityController));
/**
 * GET /api/university/academies/:id
 * Get academy by ID with courses
 */
router.get('/academies/:id', university_controller_1.universityController.getAcademyById.bind(university_controller_1.universityController));
/**
 * POST /api/university/academies
 * Create new academy (Admin only)
 */
router.post('/academies', (0, roles_middleware_1.requireRole)(['ADMIN']), university_controller_1.universityController.createAcademy.bind(university_controller_1.universityController));
// ===== Course Routes =====
/**
 * GET /api/university/courses/available
 * Get available courses for current user (filtered by grade)
 */
router.get('/courses/available', university_controller_1.universityController.getAvailableCourses.bind(university_controller_1.universityController));
/**
 * GET /api/university/courses
 * Get all courses with filters
 */
router.get('/courses', university_controller_1.universityController.getCourses.bind(university_controller_1.universityController));
/**
 * GET /api/university/courses/:id
 * Get course by ID with modules
 */
router.get('/courses/:id', university_controller_1.universityController.getCourseById.bind(university_controller_1.universityController));
/**
 * POST /api/university/courses
 * Create new course (Admin only)
 */
router.post('/courses', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.createCourse.bind(university_controller_1.universityController));
/**
 * POST /api/university/courses/:id/enroll
 * Enroll in a course
 */
router.post('/courses/:id/enroll', university_controller_1.universityController.enrollInCourse.bind(university_controller_1.universityController));
/**
 * POST /api/university/courses/:id/complete
 * Complete a course
 */
router.post('/courses/:id/complete', university_controller_1.universityController.completeCourse.bind(university_controller_1.universityController));
// ===== Enrollment Routes =====
/**
 * GET /api/university/my-courses
 * Get my enrolled courses (legacy)
 */
router.get('/my-courses', enrollment_controller_1.enrollmentController.getMyEnrollments.bind(enrollment_controller_1.enrollmentController));
// ===== Enrollment Routes =====
/**
 * POST /api/university/enrollments
 * Enroll in a course
 */
router.post('/enrollments', enrollment_controller_1.enrollmentController.enroll.bind(enrollment_controller_1.enrollmentController));
/**
 * GET /api/university/enrollments/my
 * Get my enrolled courses
 */
router.get('/enrollments/my', enrollment_controller_1.enrollmentController.getMyEnrollments.bind(enrollment_controller_1.enrollmentController));
/**
 * GET /api/university/enrollments/:id
 * Get enrollment details
 */
router.get('/enrollments/:id', enrollment_controller_1.enrollmentController.getEnrollmentById.bind(enrollment_controller_1.enrollmentController));
/**
 * DELETE /api/university/enrollments/:id
 * Withdraw from a course
 */
router.delete('/enrollments/:id', enrollment_controller_1.enrollmentController.withdraw.bind(enrollment_controller_1.enrollmentController));
/**
 * PUT /api/university/enrollments/:id/progress
 * Update module progress
 */
router.put('/enrollments/:id/progress', enrollment_controller_1.enrollmentController.updateProgress.bind(enrollment_controller_1.enrollmentController));
// ===== Certification Routes =====
/**
 * GET /api/university/certifications
 * Get my certifications
 */
router.get('/certifications', university_controller_1.universityController.getCertifications.bind(university_controller_1.universityController));
// ===== Trainer Routes =====
/**
 * GET /api/university/trainers/dashboard
 * Get trainer personal dashboard (Read-only)
 */
router.get('/trainers/dashboard', university_controller_1.universityController.getTrainerDashboard.bind(university_controller_1.universityController));
/**
 * POST /api/university/trainers
 * Apply to become a trainer
 */
router.post('/trainers', university_controller_1.universityController.createTrainer.bind(university_controller_1.universityController));
/**
 * POST /api/university/trainers/:id/accredit
 * Accredit a trainer (Admin/HR only)
 */
router.post('/trainers/:id/accredit', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.accreditTrainer.bind(university_controller_1.universityController));
/**
 * POST /api/university/trainers/mentorship
 * Start mentorship period (Admin/HR/Dept Head)
 */
router.post('/trainers/mentorship', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD']), university_controller_1.universityController.startMentorship.bind(university_controller_1.universityController));
/**
 * POST /api/university/trainers/mentorship/:id/complete
 * Finalize mentorship (Trainer/Admin only)
 */
router.post('/trainers/mentorship/:id/complete', university_controller_1.universityController.completeMentorship.bind(university_controller_1.universityController));
// ===== Quiz Routes =====
/**
 * GET /api/university/quizzes/:materialId
 * Get quiz structure
 */
router.get('/quizzes/:materialId', university_controller_1.universityController.getQuiz.bind(university_controller_1.universityController));
/**
 * POST /api/university/quizzes/:id/submit
 * Submit quiz attempt
 */
router.post('/quizzes/:id/submit', university_controller_1.universityController.submitQuizAttempt.bind(university_controller_1.universityController));
// ===== Security & Anti-Fraud Routes =====
/**
 * GET /api/university/security/signals
 * Get anti-fraud signals (Admin/HR only)
 */
router.get('/security/signals', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.getSecuritySignals.bind(university_controller_1.universityController));
/**
 * POST /api/university/security/signals/:id/validate
 * Validate a signal (Admin/HR only)
 */
router.post('/security/signals/:id/validate', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.validateSignal.bind(university_controller_1.universityController));
/**
 * POST /api/university/security/certifications/:id/invalidate
 * Invalidate a certification (Admin/HR only)
 */
router.post('/security/certifications/:id/invalidate', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.invalidateCertification.bind(university_controller_1.universityController));
// ===== Analytics Routes =====
/**
 * GET /api/university/analytics/overview
 * Get university analytics overview (Admin/HR only)
 */
router.get('/analytics/overview', (0, roles_middleware_1.requireRole)(['ADMIN', 'HR_MANAGER']), university_controller_1.universityController.getAnalyticsOverview.bind(university_controller_1.universityController));
exports.default = router;
