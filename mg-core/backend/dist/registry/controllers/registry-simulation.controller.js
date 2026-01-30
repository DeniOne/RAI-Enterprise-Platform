"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrySimulationController = exports.RegistrySimulationController = void 0;
const registry_simulation_service_1 = require("../services/registry-simulation.service");
class RegistrySimulationController {
    /**
     * POST /api/registry/simulation/diff
     * Body: { entity_type, role, overlay_rules: [] }
     */
    async predictDiff(req, res) {
        try {
            const { entity_type, role, overlay_rules } = req.body;
            if (!entity_type || !role || !Array.isArray(overlay_rules)) {
                res.status(400).json({ message: 'Invalid payload. usage: { entity_type, role, overlay_rules: [] }' });
                return;
            }
            const diff = await registry_simulation_service_1.registrySimulationService.simulateVisibilityChange(entity_type, role, overlay_rules);
            res.json(diff);
        }
        catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}
exports.RegistrySimulationController = RegistrySimulationController;
exports.registrySimulationController = new RegistrySimulationController();
