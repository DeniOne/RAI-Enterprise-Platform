import { Request, Response } from 'express';
import { prisma } from '../../config/prisma';
import { registryImpactAnalysisEngine } from '../core/registry-impact.engine';
import { ChangeType, ImpactPreviewDto } from '../dto/impact.types';
import { logger } from '../../config/logger';

export class RegistryImpactController {

    async preview(req: Request, res: Response): Promise<void> {
        // Read-Only Transaction
        // We perform the analysis inside a transaction to ensure consistent read state
        // even though we don't write.
        try {
            const dto: ImpactPreviewDto = req.body;

            // Validate DTO basics
            if (!dto.change_type || !dto.target_urn) {
                res.status(400).json({ error: 'Bad Request', message: 'Missing change_type or target_urn' });
                return;
            }

            const report = await prisma.$transaction(async (tx) => {
                const report = await registryImpactAnalysisEngine.analyzeChange(
                    tx,
                    dto.change_type,
                    dto.target_urn,
                    dto.proposed_data
                );

                // Audit the Preview Execution
                // Note: We are inside a transaction. Writing audit log here commits it if tx commits.
                // We want to log even if preview shows blocks? Yes.
                await tx.registryAuditEvent.create({
                    data: {
                        action: 'IMPACT_PREVIEW_EXECUTED',
                        entity_urn: dto.target_urn,
                        actor_urn: 'urn:mg:system:api', // TODO: user context
                        payload: {
                            change_type: dto.change_type,
                            summary: report.summary,
                            graph_hash: report.graph_snapshot_hash
                        }
                    }
                });

                return report;
            }); // Transaction validation: Read-only effectively for entities, but we write Audit.

            res.json(report);

        } catch (error: any) {
            logger.error('Impact Preview failed', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
}

export const registryImpactController = new RegistryImpactController();
