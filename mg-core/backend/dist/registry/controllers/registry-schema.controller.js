"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrySchemaController = exports.RegistrySchemaController = void 0;
const registry_schema_service_1 = require("../services/registry-schema.service");
class RegistrySchemaController {
    async getSchema(req, res, next) {
        try {
            const { entityTypeUrn } = req.params;
            // Decoding URN
            const decodedUrn = decodeURIComponent(entityTypeUrn);
            const schema = await registry_schema_service_1.registrySchemaService.getSchema(decodedUrn);
            res.json(schema);
        }
        catch (error) {
            if (error.message.includes('not found')) {
                res.status(404).json({ message: error.message });
            }
            else {
                next(error);
            }
        }
    }
}
exports.RegistrySchemaController = RegistrySchemaController;
exports.registrySchemaController = new RegistrySchemaController();
