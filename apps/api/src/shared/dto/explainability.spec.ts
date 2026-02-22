import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { AIExplainabilityDto } from './explainability.dto';

describe('AIExplainabilityDto', () => {
    it('should validate a correct explainability object', async () => {
        const plain = {
            confidence: 0.95,
            verdict: 'HIGHLY_PROBABLE',
            factors: [
                { name: 'Factor 1', weight: 0.8, impact: 0.9 }
            ],
            forensic: {
                modelVersion: 'v1',
                canonicalHash: 'hash',
                seed: 'seed123',
                ledgerId: 'TRC-1'
            },
            limitationsDisclosed: true
        };

        const dto = plainToInstance(AIExplainabilityDto, plain);
        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('should fail if confidence is missing', async () => {
        const plain = {
            verdict: 'OK',
            factors: []
        };

        const dto = plainToInstance(AIExplainabilityDto, plain);
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.find(e => e.property === 'confidence')).toBeDefined();
    });

    it('should validate nested factors', async () => {
        const plain = {
            confidence: 1,
            verdict: 'TEST',
            factors: [
                { name: 'Invalid', weight: 'not-a-number', impact: 0.5 }
            ]
        };

        const dto = plainToInstance(AIExplainabilityDto, plain);
        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
    });
});
