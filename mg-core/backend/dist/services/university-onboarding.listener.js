"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversityOnboardingListener = void 0;
const prisma_1 = require("../config/prisma");
/**
 * UniversityOnboardingListener
 *
 * CRITICAL: Initializes learning context when employee is onboarded
 *
 * This listener ensures that every new employee:
 * 1. Gets initial qualification level (INTERN = Photon)
 * 2. Gets enrolled in mandatory courses
 * 3. Has a learning profile created
 *
 * Integration: Listens to employee.onboarded event from EmployeeRegistrationService
 */
class UniversityOnboardingListener {
    logger = {
        log: (msg) => console.log(`[UniversityOnboardingListener] ${msg}`),
        warn: (msg) => console.warn(`[UniversityOnboardingListener] ${msg}`),
        error: (msg) => console.error(`[UniversityOnboardingListener] ${msg}`)
    };
    async handleEmployeeOnboarded(payload) {
        this.logger.log(`Initializing learning context for employee ${payload.employeeId}`);
        try {
            // 1. Set initial qualification (INTERN = Photon)
            await this.setInitialQualification(payload.userId);
            // 2. Enroll in mandatory courses
            await this.enrollInMandatoryCourses(payload.userId);
            // 3. Create learning profile (if needed)
            await this.createLearningProfile(payload.userId);
            this.logger.log(`Learning context initialized for employee ${payload.employeeId}`);
        }
        catch (error) {
            this.logger.error(`Failed to initialize learning context: ${error.message}`);
            // НЕ бросаем ошибку — onboarding не должен падать из-за University
        }
    }
    /**
     * Set initial qualification level (INTERN = Photon)
     *
     * CANON: All new employees start as INTERN (Photon level)
     */
    async setInitialQualification(userId) {
        // Check if user_grade already exists
        const existing = await prisma_1.prisma.userGrade.findUnique({
            where: { user_id: userId },
        });
        if (existing) {
            this.logger.warn(`UserGrade already exists for user ${userId}`);
            return;
        }
        // Create initial qualification
        await prisma_1.prisma.userGrade.create({
            data: {
                user_id: userId,
                current_grade: 'INTERN', // Photon level
            },
        });
        this.logger.log(`Initial qualification set to INTERN for user ${userId}`);
    }
    /**
     * Enroll user in all mandatory courses
     *
     * CANON: Mandatory courses are assigned automatically on onboarding
     */
    async enrollInMandatoryCourses(userId) {
        // Get all mandatory courses
        const mandatoryCourses = await prisma_1.prisma.course.findMany({
            where: {
                is_mandatory: true,
                is_active: true,
            },
        });
        if (mandatoryCourses.length === 0) {
            this.logger.log(`No mandatory courses found`);
            return;
        }
        // Enroll in each mandatory course
        for (const course of mandatoryCourses) {
            // Check if already enrolled
            const existing = await prisma_1.prisma.enrollment.findFirst({
                where: {
                    user_id: userId,
                    course_id: course.id,
                },
            });
            if (existing) {
                continue; // Already enrolled
            }
            // Create enrollment
            await prisma_1.prisma.enrollment.create({
                data: {
                    user_id: userId,
                    course_id: course.id,
                    status: 'ACTIVE',
                    progress: 0,
                },
            });
            this.logger.log(`Enrolled user ${userId} in mandatory course ${course.title}`);
        }
    }
    /**
     * Create learning profile for user
     *
     * NOTE: This is a placeholder for future learning profile functionality
     * Currently just ensures user_grade exists (created in setInitialQualification)
     */
    async createLearningProfile(userId) {
        // Learning profile is represented by user_grade
        // Already created in setInitialQualification
        this.logger.log(`Learning profile ready for user ${userId}`);
    }
}
exports.UniversityOnboardingListener = UniversityOnboardingListener;
