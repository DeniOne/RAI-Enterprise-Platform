"use strict";
/**
 * Impact Controller (Secure API)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.impactController = exports.ImpactController = void 0;
const impact_service_1 = require("./impact.service");
const logger_1 = require("../config/logger");
class ImpactController {
    /**
     * GET /api/impact/:entityType/:id?view=xxx
     */
    getImpactReport = async (req, res) => {
        const { entityType, id } = req.params;
        const view = req.query.view;
        if (!view) {
            return res.status(400).send({ error: 'View parameter is required' });
        }
        try {
            const report = impact_service_1.impactService.getImpactReport(entityType, id, view);
            return res.send(report);
        }
        catch (error) {
            logger_1.logger.error(`[ImpactController] Error fetching impact ${entityType}/${id}`, error);
            if (error.message.includes('not found')) {
                return res.status(404).send({ error: error.message });
            }
            if (error.message.includes('Security Violation')) {
                return res.status(403).send({ error: error.message });
            }
            return res.status(500).send({ error: 'Internal Server Error' });
        }
    };
}
exports.ImpactController = ImpactController;
exports.impactController = new ImpactController();
