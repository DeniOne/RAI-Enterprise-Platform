import { Request, Response } from 'express';
import { registrySimulationService } from '../services/registry-simulation.service';

export class RegistrySimulationController {

    /**
     * POST /api/registry/simulation/diff
     * Body: { entity_type, role, overlay_rules: [] }
     */
    async predictDiff(req: Request, res: Response) {
        try {
            const { entity_type, role, overlay_rules } = req.body;

            if (!entity_type || !role || !Array.isArray(overlay_rules)) {
                res.status(400).json({ message: 'Invalid payload. usage: { entity_type, role, overlay_rules: [] }' });
                return;
            }

            const diff = await registrySimulationService.simulateVisibilityChange(entity_type, role, overlay_rules);

            res.json(diff);

        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    }
}

export const registrySimulationController = new RegistrySimulationController();
