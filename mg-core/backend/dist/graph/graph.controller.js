"use strict";
/**
 * Graph Controller (Secure API)
 *
 * Exposes GraphService via secure endpoint.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.graphController = exports.GraphController = void 0;
const graph_service_1 = require("./graph.service");
const logger_1 = require("../config/logger");
class GraphController {
    /**
     * GET /api/graph/:entityType/:id?view=xxx
     */
    getGraph = async (req, res) => {
        const { entityType, id } = req.params;
        const view = req.query.view;
        if (!view) {
            return res.status(400).send({ error: 'View parameter is required' });
        }
        try {
            const graph = graph_service_1.graphService.getGraph(entityType, id, view);
            return res.send(graph);
        }
        catch (error) {
            logger_1.logger.error(`[GraphController] Error fetching graph ${entityType}/${id}`, error);
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
exports.GraphController = GraphController;
exports.graphController = new GraphController();
