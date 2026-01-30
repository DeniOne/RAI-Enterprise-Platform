import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { EmployeeRegistrationService } from '../../services/employee-registration.service';

const prisma = new PrismaClient();
const registrationService = EmployeeRegistrationService.getInstance();

/**
 * Employee Onboarding E2E Test
 * 
 * Tests the complete employee registration flow:
 * 1. HR Layer: User + Employee + PersonalFile creation
 * 2. MVP Layer: Qualification + Learning Profile + Mandatory Courses
 * 
 * This test verifies the integration between:
 * - EmployeeRegistrationService
 * - EmployeeOnboardedListener (Module 33)
 * - UniversityOnboardingListener (Module 13)
 */
describe('Employee Onboarding E2E Flow', () => {
    let testRegistrationId: string;
    let testUserId: string;
    let testEmployeeId: string;
    const hrManagerId = 'test-hr-manager-id';

    beforeAll(async () => {
        // Create test registration request
        const result = await prisma.$queryRaw<any[]>`
            INSERT INTO employee_registration_requests (
                telegram_id,
                first_name,
                last_name,
                middle_name,
                email,
                phone,
                birth_date,
                position,
                status,
                current_step
            ) VALUES (
                '999999999',
                'Тест',
                'Тестов',
                'Тестович',
                'test@example.com',
                '+375291234567',
                '1990-01-01',
                'Test Position',
                'REVIEW'::registration_status,
                'COMPLETED'::registration_step
            )
            RETURNING id
        `;

        testRegistrationId = result[0].id;
    });

    afterAll(async () => {
        // Cleanup: Delete test data
        if (testUserId) {
            await prisma.userGrade.deleteMany({ where: { user_id: testUserId } });
            await prisma.enrollment.deleteMany({ where: { user_id: testUserId } });
        }

        if (testEmployeeId) {
            await prisma.personalFile.deleteMany({ where: { employeeId: testEmployeeId } });
            await prisma.employee.deleteMany({ where: { id: testEmployeeId } });
        }

        if (testUserId) {
            await prisma.user.deleteMany({ where: { id: testUserId } });
        }

        await prisma.$executeRaw`
            DELETE FROM employee_registration_requests WHERE id = ${testRegistrationId}::uuid
        `;

        await prisma.$disconnect();
    });

    it('should complete full onboarding with MVP integration', async () => {
        // ===== STEP 1: Approve Registration =====
        await registrationService.approveRegistration(testRegistrationId, hrManagerId);

        // ===== STEP 2: Verify HR Layer =====

        // 2.1. Verify User created
        const user = await prisma.user.findUnique({
            where: { email: 'test@example.com' }
        });
        expect(user).toBeDefined();
        expect(user?.first_name).toBe('Тест');
        expect(user?.last_name).toBe('Тестов');
        expect(user?.role).toBe('EMPLOYEE');
        expect(user?.status).toBe('ACTIVE');
        testUserId = user!.id;

        // 2.2. Verify Employee created
        const employee = await prisma.employee.findUnique({
            where: { user_id: testUserId }
        });
        expect(employee).toBeDefined();
        expect(employee?.position).toBe('Test Position');
        testEmployeeId = employee!.id;

        // 2.3. Verify PersonalFile created (Module 33)
        // Wait for event processing
        await new Promise(resolve => setTimeout(resolve, 1000));

        const personalFile = await prisma.personalFile.findUnique({
            where: { employeeId: testEmployeeId }
        });
        expect(personalFile).toBeDefined();
        expect(personalFile?.hrStatus).toBe('ONBOARDING');
        expect(personalFile?.fileNumber).toMatch(/^PF-\d{4}-\d{5}$/);

        // 2.4. Verify HR Domain Event emitted
        const hrEvent = await prisma.hrDomainEvent.findFirst({
            where: {
                eventType: 'EMPLOYEE_HIRED',
                aggregateId: personalFile!.id
            }
        });
        expect(hrEvent).toBeDefined();

        // ===== STEP 3: Verify MVP Layer =====

        // 3.1. Verify Initial Qualification (Photon = INTERN)
        const qualification = await prisma.userGrade.findUnique({
            where: { user_id: testUserId }
        });
        expect(qualification).toBeDefined();
        expect(qualification?.current_grade).toBe('INTERN'); // Photon level
        expect(qualification?.mc_balance).toBe(0);
        expect(qualification?.gmc_balance).toBe(0);

        // 3.2. Verify Learning Profile created
        // Learning profile is represented by user_grade
        expect(qualification).toBeDefined(); // Already verified above

        // 3.3. Verify Mandatory Courses assigned
        const mandatoryCourses = await prisma.course.findMany({
            where: {
                is_mandatory: true,
                is_active: true
            }
        });

        if (mandatoryCourses.length > 0) {
            const enrollments = await prisma.enrollment.findMany({
                where: { user_id: testUserId }
            });

            expect(enrollments.length).toBeGreaterThan(0);
            expect(enrollments.every(e => e.status === 'ACTIVE')).toBe(true);
            expect(enrollments.every(e => e.progress === 0)).toBe(true);
        }

        // 3.4. Verify NO economic effects (wallet balance = 0)
        // Wallet is represented by user_grade.mc_balance
        expect(qualification?.mc_balance).toBe(0);
        expect(qualification?.gmc_balance).toBe(0);

        // ===== STEP 4: Verify Registration Status =====
        const registration = await prisma.$queryRaw<any[]>`
            SELECT status FROM employee_registration_requests WHERE id = ${testRegistrationId}::uuid
        `;
        expect(registration[0].status).toBe('APPROVED');
    }, 30000); // 30 second timeout for async event processing

    it('should prevent duplicate approval (idempotency)', async () => {
        // Try to approve the same registration again
        await expect(
            registrationService.approveRegistration(testRegistrationId, hrManagerId)
        ).rejects.toThrow('Registration already approved');
    });

    it('should not create duplicate PersonalFile', async () => {
        // Verify only one PersonalFile exists
        const personalFiles = await prisma.personalFile.findMany({
            where: { employeeId: testEmployeeId }
        });
        expect(personalFiles.length).toBe(1);
    });

    it('should not create duplicate UserGrade', async () => {
        // Verify only one UserGrade exists
        const userGrades = await prisma.userGrade.findMany({
            where: { user_id: testUserId }
        });
        expect(userGrades.length).toBe(1);
    });
});
