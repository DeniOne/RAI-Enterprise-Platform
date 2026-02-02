// f:\RAI_EP\packages\agro-orchestrator\src/Orchestrator.spec.ts
import { AgroOrchestrator } from './Orchestrator';
import { RuleEngine } from './RuleEngine';
import { RapeseedPreset, getRapeseedStageById } from './presets/rapeseed';
import { AgroContext, CanonicalStage } from './types';

describe('AgroOrchestrator', () => {
    let orchestrator: AgroOrchestrator;
    let mockContext: AgroContext;

    beforeEach(() => {
        orchestrator = new AgroOrchestrator();
        mockContext = {
            fieldId: 'field-1',
            cropCycleId: 'cycle-1',
            currentStageId: '03_SEEDBED_PREP',
            inputData: {
                soilMoisture: 15,
                soilTemp: 10,
                machineryReady: true
            }
        };
    });

    it('should initialize correctly', () => {
        expect(orchestrator).toBeDefined();
    });

    it('should validate transition via RuleEngine', async () => {
        const targetStage = getRapeseedStageById('04_SOWING')!;

        // Rule: Moisture must be > 12
        const rules = [{
            id: 'MOISTURE_CHECK',
            condition: { ">": [{ "var": "soilMoisture" }, 12] } as any,
            errorMessage: "Soil moisture {soilMoisture}% is too low",
            severity: 'BLOCK' as const
        }];

        const result = await orchestrator.transition(targetStage, mockContext, rules, true);

        expect(result.success).toBe(true);
        expect(result.validation.status).toBe('OK');
    });

    it('should block transition if rule fails', async () => {
        const targetStage = getRapeseedStageById('04_SOWING')!;

        // Context with bad moisture
        const badContext = { ...mockContext, inputData: { soilMoisture: 10 } };

        // Rule: Moisture must be > 12
        const rules = [{
            id: 'MOISTURE_CHECK',
            condition: { ">": [{ "var": "soilMoisture" }, 12] } as any,
            errorMessage: "Soil moisture {soilMoisture}% is too low",
            severity: 'BLOCK' as const
        }];

        const result = await orchestrator.transition(targetStage, badContext, rules, true);

        expect(result.success).toBe(false);
        expect(result.validation.status).toBe('BLOCK');
        expect(result.validation.reason).toBe("Soil moisture 10% is too low");
    });
});
