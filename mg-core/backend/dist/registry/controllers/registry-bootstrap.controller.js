"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryBootstrapController = exports.RegistryBootstrapController = void 0;
const registry_bootstrap_service_1 = require("../services/registry-bootstrap.service");
const logger_1 = require("../../config/logger");
class RegistryBootstrapController {
    async bootstrap(req, res) {
        // Double check admin role? Already handled by middleware in routes?
        // We will assume middleware handles auth.
        try {
            await registry_bootstrap_service_1.registryBootstrapService.run();
            res.status(201).json({ message: 'Registry bootstrapped successfully.' });
        }
        catch (error) {
            if (error.message.includes('Registry is not empty')) {
                res.status(409).json({ error: 'Conflict', message: error.message });
            }
            else {
                logger_1.logger.error('Bootstrap failed', error);
                res.status(500).json({ error: 'Internal Server Error', message: error.message });
            }
        }
    }
}
exports.RegistryBootstrapController = RegistryBootstrapController;
exports.registryBootstrapController = new RegistryBootstrapController();
