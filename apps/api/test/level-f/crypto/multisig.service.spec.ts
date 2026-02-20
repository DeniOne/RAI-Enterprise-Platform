import { Test, TestingModule } from '@nestjs/testing';
import { MultisigService } from '../../../src/level-f/crypto/multisig.service';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('MultisigService (M-of-N Governance)', () => {
    let service: MultisigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [MultisigService],
        }).compile();

        service = module.get<MultisigService>(MultisigService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should create a governance session', () => {
        const session = service.createSession('PANIC_HALT', { reason: 'Suspicious activity' });
        expect(session.sessionId).toBeDefined();
        expect(session.targetThreshold).toBe(5);
        expect(session.totalSigners).toBe(7);
    });

    it('should require 5 signatures to execute', () => {
        const session = service.createSession('UPDATE_FORMULA', { version: '2.0' });

        // 4 signatures (Not enough)
        for (let i = 1; i <= 4; i++) {
            service.provideSignature(session.sessionId, `Oracle_${i}`, `sig_${i}`);
        }

        expect(service.isActionExecutable(session.sessionId)).toBeFalsy();

        try {
            service.markExecuted(session.sessionId);
        } catch (e: any) {
            expect(e.status).toBe(HttpStatus.FORBIDDEN);
        }

        // 5th signature (Threshold met)
        service.provideSignature(session.sessionId, 'Oracle_5', 'sig_5');

        expect(service.isActionExecutable(session.sessionId)).toBeTruthy();

        // Execute safely
        service.markExecuted(session.sessionId);
        // After execution, should lock out further execution
        expect(service.isActionExecutable(session.sessionId)).toBeFalsy();
    });

    it('should reject duplicate signatures from the same oracle', () => {
        const session = service.createSession('REASSIGN_AUTHORITY', { newOracle: 'Oracle_10' });

        service.provideSignature(session.sessionId, 'Oracle_1', 'sig_1');

        expect(() => {
            service.provideSignature(session.sessionId, 'Oracle_1', 'sig_1_duplicate');
        }).toThrow(HttpException);
    });
});
