import { describe, it, expect, beforeEach } from '@jest/globals';
import { ProtocolValidator } from './ProtocolValidator';
import { Protocol, Trial, Measurement } from '@rai/prisma-client';

describe('ProtocolValidator', () => {
    let validator: ProtocolValidator;

    beforeEach(() => {
        validator = new ProtocolValidator();
    });

    it('should be valid if all required variables are present and no deviations', () => {
        const protocol = {
            variables: { required: ['MOISTURE', 'YIELD'] }
        } as unknown as Protocol;

        const trial = {
            deviations: null,
            measurements: [
                { variable: 'MOISTURE' },
                { variable: 'YIELD' },
                { variable: 'TEMP' }
            ]
        } as unknown as Trial & { measurements: Measurement[] };

        const result = validator.validateTrial(trial, protocol);
        expect(result.isValid).toBe(true);
        expect(result.deviations).toHaveLength(0);
    });

    it('should be invalid if missing required variables', () => {
        const protocol = {
            variables: { required: ['MOISTURE', 'YIELD'] }
        } as unknown as Protocol;

        const trial = {
            deviations: null,
            measurements: [
                { variable: 'MOISTURE' } // missing YIELD
            ]
        } as unknown as Trial & { measurements: Measurement[] };

        const result = validator.validateTrial(trial, protocol);
        expect(result.isValid).toBe(false);
        expect(result.deviations).toContain('Missing mandatory measurement: YIELD');
    });

    it('should be invalid if manual deviation recorded', () => {
        const protocol = {
            variables: { required: ['MOISTURE'] }
        } as unknown as Protocol;

        const trial = {
            deviations: 'Bad weather',
            measurements: [
                { variable: 'MOISTURE' }
            ]
        } as unknown as Trial & { measurements: Measurement[] };

        const result = validator.validateTrial(trial, protocol);
        expect(result.isValid).toBe(false);
        expect(result.deviations).toContain('Manual deviation recorded: Bad weather');
    });
});
