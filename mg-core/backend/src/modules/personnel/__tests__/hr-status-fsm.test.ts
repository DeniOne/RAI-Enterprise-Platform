import { validateHRStatusTransition, HRStatusFSMError, isTerminalStatus } from '../domain/hr-status-fsm';
import { HRStatus } from '@prisma/client';

describe('HRStatus FSM Validation', () => {
    describe('Valid Transitions', () => {
        it('should allow ONBOARDING → EMPLOYED', () => {
            expect(() => validateHRStatusTransition('ONBOARDING', 'EMPLOYED')).not.toThrow();
        });

        it('should allow ONBOARDING → PROBATION', () => {
            expect(() => validateHRStatusTransition('ONBOARDING', 'PROBATION')).not.toThrow();
        });

        it('should allow PROBATION → EMPLOYED', () => {
            expect(() => validateHRStatusTransition('PROBATION', 'EMPLOYED')).not.toThrow();
        });

        it('should allow EMPLOYED → SUSPENDED', () => {
            expect(() => validateHRStatusTransition('EMPLOYED', 'SUSPENDED')).not.toThrow();
        });

        it('should allow EMPLOYED → LEAVE', () => {
            expect(() => validateHRStatusTransition('EMPLOYED', 'LEAVE')).not.toThrow();
        });

        it('should allow EMPLOYED → TERMINATED', () => {
            expect(() => validateHRStatusTransition('EMPLOYED', 'TERMINATED')).not.toThrow();
        });

        it('should allow TERMINATED → ARCHIVED', () => {
            expect(() => validateHRStatusTransition('TERMINATED', 'ARCHIVED')).not.toThrow();
        });
    });

    describe('Invalid Transitions', () => {
        it('should prevent EMPLOYED → ONBOARDING', () => {
            expect(() => validateHRStatusTransition('EMPLOYED', 'ONBOARDING'))
                .toThrow(HRStatusFSMError);
        });

        it('should prevent PROBATION → ONBOARDING', () => {
            expect(() => validateHRStatusTransition('PROBATION', 'ONBOARDING'))
                .toThrow(HRStatusFSMError);
        });

        it('should prevent TERMINATED → EMPLOYED', () => {
            expect(() => validateHRStatusTransition('TERMINATED', 'EMPLOYED'))
                .toThrow(HRStatusFSMError);
        });

        it('should prevent ARCHIVED → any state', () => {
            expect(() => validateHRStatusTransition('ARCHIVED', 'EMPLOYED'))
                .toThrow('terminal state');
        });

        it('should prevent ARCHIVED → TERMINATED', () => {
            expect(() => validateHRStatusTransition('ARCHIVED', 'TERMINATED'))
                .toThrow(HRStatusFSMError);
        });
    });

    describe('Terminal Status', () => {
        it('should identify ARCHIVED as terminal', () => {
            expect(isTerminalStatus('ARCHIVED')).toBe(true);
        });

        it('should identify EMPLOYED as non-terminal', () => {
            expect(isTerminalStatus('EMPLOYED')).toBe(false);
        });

        it('should identify ONBOARDING as non-terminal', () => {
            expect(isTerminalStatus('ONBOARDING')).toBe(false);
        });
    });
});
