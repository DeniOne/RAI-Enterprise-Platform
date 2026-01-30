"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryRelationshipController = exports.RegistryRelationshipController = void 0;
const registry_relationship_service_1 = require("../services/registry-relationship.service");
const registry_mutation_service_1 = require("../services/registry-mutation.service");
const logger_1 = require("../../config/logger");
class RegistryRelationshipController {
    async create(req, res) {
        try {
            const result = await registry_mutation_service_1.registryMutationService.createRelationship(req.body);
            if (result.meta?.override_applied) {
                res.status(200).json(result);
            }
            else {
                res.status(201).json(result.data);
            }
        }
        catch (error) {
            if (error.message.includes('Cycle detected') || error.message.includes('Cardinality violation') || error.message.includes('already has') || error.message.includes('blocked by Impact Analysis')) {
                res.status(409).json({ error: 'Conflict', message: error.message });
            }
            else if (error.message.includes('not found') || error.message.includes('does not match')) {
                res.status(400).json({ error: 'Bad Request', message: error.message });
            }
            else {
                logger_1.logger.error('Create relationship failed', error);
                res.status(500).json({ error: 'Internal Server Error', message: error.message });
            }
        }
    }
    async list(req, res) {
        try {
            const { definition_urn, from_urn, to_urn } = req.query;
            const relationships = await registry_relationship_service_1.registryRelationshipService.getRelationships(definition_urn, from_urn, to_urn);
            res.json(relationships);
        }
        catch (error) {
            logger_1.logger.error('List relationships failed', error);
            res.status(500).json({ error: 'Internal Server Error', message: error.message });
        }
    }
}
exports.RegistryRelationshipController = RegistryRelationshipController;
exports.registryRelationshipController = new RegistryRelationshipController();
