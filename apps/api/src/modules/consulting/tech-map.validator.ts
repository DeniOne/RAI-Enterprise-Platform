
import { Injectable, BadRequestException } from '@nestjs/common';
import { TechMap, MapStage, MapOperation, MapResource } from '@rai/prisma-client';
import { UnitNormalizationService, SupportedUnit } from './unit-normalization.service';

type FullTechMap = TechMap & {
    stages: (MapStage & {
        operations: (MapOperation & {
            resources: MapResource[]
        })[]
    })[]
};

@Injectable()
export class TechMapValidator {
    constructor(
        private readonly unitService: UnitNormalizationService
    ) { }

    /**
     * Validates a TechMap for activation capability.
     * Enforces Phase 2 Rules: Strict Types, Norms, Units.
     */
    validateForActivation(techMap: FullTechMap): void {
        const errors: string[] = [];

        if (!techMap.stages || techMap.stages.length === 0) {
            errors.push('TechMap must have at least one stage');
        }

        techMap.stages.forEach(stage => {
            stage.operations.forEach(op => {
                // Strict Norm validation
                if (!op.resources || op.resources.length === 0) {
                    // Warnings allowed? Phase 2 docs say "100% budget from norms".
                    // If an operation has NO resources, it generates NO budget. This might be valid (e.g. "Inspection").
                    // But if it implies cost (e.g. Fuel), it MUST be detailed. 
                    // specific logic for machinery type check could be added here.
                }

                op.resources.forEach(res => {
                    this.validateResource(res, op.name, errors);
                });
            });
        });

        if (errors.length > 0) {
            throw new BadRequestException(`TechMap Activation Failed:\n${errors.join('\n')}`);
        }
    }

    private validateResource(res: MapResource, opName: string, errors: string[]) {
        // 1. Amount must be positive
        if (typeof res.amount !== 'number' || res.amount <= 0) {
            errors.push(`Operation '${opName}': Resource '${res.name}' has invalid amount (${res.amount})`);
        }

        // 2. Unit must be canonicalizable
        try {
            this.unitService.normalize(res.amount, res.unit);
        } catch (e) {
            errors.push(`Operation '${opName}': Resource '${res.name}' has invalid unit '${res.unit}'. Error: ${e.message}`);
        }

        // 3. Cost check (Optional for map, but good for warnings)
        // Prices are fetched from Registry, but here we might check if 'costPerUnit' is cached/estimated?
        // Focusing on physical norms for Phase 2.1
    }
}
