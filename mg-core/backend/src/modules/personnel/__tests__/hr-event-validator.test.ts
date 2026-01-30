import { validateActorRole, UnauthorizedEventError } from '../domain/hr-event-validator';
import { HREventType } from '@prisma/client';

describe('Event Role Authorization', () => {
    describe('DIRECTOR Permissions', () => {
        it('should allow DIRECTOR to sign orders', () => {
            expect(() => validateActorRole('ORDER_SIGNED', 'DIRECTOR')).not.toThrow();
        });

        it('should allow DIRECTOR to hire employees', () => {
            expect(() => validateActorRole('EMPLOYEE_HIRED', 'DIRECTOR')).not.toThrow();
        });

        it('should allow DIRECTOR to dismiss employees', () => {
            expect(() => validateActorRole('EMPLOYEE_DISMISSED', 'DIRECTOR')).not.toThrow();
        });

        it('should allow DIRECTOR to terminate contracts', () => {
            expect(() => validateActorRole('CONTRACT_TERMINATED', 'DIRECTOR')).not.toThrow();
        });
    });

    describe('HR_MANAGER Permissions', () => {
        it('should allow HR_MANAGER to hire employees', () => {
            expect(() => validateActorRole('EMPLOYEE_HIRED', 'HR_MANAGER')).not.toThrow();
        });

        it('should allow HR_MANAGER to create orders', () => {
            expect(() => validateActorRole('ORDER_CREATED', 'HR_MANAGER')).not.toThrow();
        });

        it('should prevent HR_MANAGER from signing orders', () => {
            expect(() => validateActorRole('ORDER_SIGNED', 'HR_MANAGER'))
                .toThrow(UnauthorizedEventError);
        });

        it('should prevent HR_MANAGER from dismissing employees', () => {
            expect(() => validateActorRole('EMPLOYEE_DISMISSED', 'HR_MANAGER'))
                .toThrow(UnauthorizedEventError);
        });
    });

    describe('HR_SPECIALIST Permissions', () => {
        it('should allow HR_SPECIALIST to upload documents', () => {
            expect(() => validateActorRole('DOCUMENT_UPLOADED', 'HR_SPECIALIST')).not.toThrow();
        });

        it('should allow HR_SPECIALIST to create orders', () => {
            expect(() => validateActorRole('ORDER_CREATED', 'HR_SPECIALIST')).not.toThrow();
        });

        it('should prevent HR_SPECIALIST from signing orders', () => {
            expect(() => validateActorRole('ORDER_SIGNED', 'HR_SPECIALIST'))
                .toThrow(UnauthorizedEventError);
        });

        it('should prevent HR_SPECIALIST from hiring employees', () => {
            expect(() => validateActorRole('EMPLOYEE_HIRED', 'HR_SPECIALIST'))
                .toThrow(UnauthorizedEventError);
        });
    });

    describe('EMPLOYEE Permissions', () => {
        it('should prevent EMPLOYEE from dismissing', () => {
            expect(() => validateActorRole('EMPLOYEE_DISMISSED', 'EMPLOYEE'))
                .toThrow(UnauthorizedEventError);
        });

        it('should prevent EMPLOYEE from signing orders', () => {
            expect(() => validateActorRole('ORDER_SIGNED', 'EMPLOYEE'))
                .toThrow(UnauthorizedEventError);
        });

        it('should prevent EMPLOYEE from uploading documents', () => {
            expect(() => validateActorRole('DOCUMENT_UPLOADED', 'EMPLOYEE'))
                .toThrow(UnauthorizedEventError);
        });
    });

    describe('SYSTEM Permissions', () => {
        it('should allow SYSTEM to expire documents', () => {
            expect(() => validateActorRole('DOCUMENT_EXPIRED', 'SYSTEM')).not.toThrow();
        });

        it('should prevent SYSTEM from signing orders', () => {
            expect(() => validateActorRole('ORDER_SIGNED', 'SYSTEM'))
                .toThrow(UnauthorizedEventError);
        });
    });
});
