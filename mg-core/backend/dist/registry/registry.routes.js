"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registryRouter = void 0;
const express_1 = require("express");
const registry_bootstrap_controller_1 = require("./controllers/registry-bootstrap.controller");
const registry_relationship_controller_1 = require("./controllers/registry-relationship.controller");
const registry_schema_controller_1 = require("./controllers/registry-schema.controller");
const registry_entity_controller_1 = require("./controllers/registry-entity.controller");
const registry_form_controller_1 = require("./controllers/registry-form.controller");
const registry_history_controller_1 = require("./controllers/registry-history.controller");
const registry_graph_controller_1 = require("./controllers/registry-graph.controller");
const registry_bulk_controller_1 = require("./controllers/registry-bulk.controller");
const registry_governance_controller_1 = require("./controllers/registry-governance.controller");
const registry_simulation_controller_1 = require("./controllers/registry-simulation.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
// DEBUG: Runtime probe
console.log('[REGISTRY ROUTES] loaded at', new Date().toISOString());
// ============================================================================
// ENTITY CRUD ENDPOINTS (Core MVP)
// ============================================================================
// GET /entities — List entities by type (PUBLIC for dev)
// Query: ?type=urn:mg:type:role&limit=50&offset=0&search=
router.get('/entities', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_entity_controller_1.registryEntityController.list);
// GET /entities/:type/:id — Get single entity by type and id (PUBLIC for dev)
router.get('/entities/:type/:id', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_entity_controller_1.registryEntityController.getById);
// POST /entities — Create new entity (JWT REQUIRED)
router.post('/entities', passport_1.default.authenticate('jwt', { session: false }), registry_entity_controller_1.registryEntityController.create);
// PATCH /entities/:type/:id — Partial update (JWT REQUIRED)
router.patch('/entities/:type/:id', passport_1.default.authenticate('jwt', { session: false }), registry_entity_controller_1.registryEntityController.partialUpdate);
// PUT /entities/:urn — Full update (JWT REQUIRED)
router.put('/entities/:urn', passport_1.default.authenticate('jwt', { session: false }), registry_entity_controller_1.registryEntityController.update);
// POST /entities/:type/:id/lifecycle — Lifecycle transition (JWT REQUIRED)
router.post('/entities/:type/:id/lifecycle', passport_1.default.authenticate('jwt', { session: false }), registry_entity_controller_1.registryEntityController.lifecycle);
// GET /entities/:type/:id/audit — Audit log (PUBLIC for dev)
router.get('/entities/:type/:id/audit', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_entity_controller_1.registryEntityController.audit);
// ============================================================================
// SCHEMA ENDPOINTS
// ============================================================================
// GET /schema/:entityTypeUrn — Get schema for entity type (PUBLIC for dev)
router.get('/schema/:entityTypeUrn', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_schema_controller_1.registrySchemaController.getSchema);
// ============================================================================
// FORM PROJECTION
// ============================================================================
// GET /entities/form-projection — Form layout/schema (PUBLIC for dev)
router.get('/form-projection', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_form_controller_1.registryFormController.getProjection);
// ============================================================================
// HISTORY & SNAPSHOTS
// ============================================================================
router.get('/history/:urn', passport_1.default.authenticate('jwt', { session: false }), registry_history_controller_1.registryHistoryController.getHistory);
router.get('/snapshots/:urn/:snapshotId', passport_1.default.authenticate('jwt', { session: false }), registry_history_controller_1.registryHistoryController.getSnapshot);
// ============================================================================
// GRAPH TRAVERSAL
// ============================================================================
router.get('/graph/context/:urn', passport_1.default.authenticate('jwt', { session: false }), registry_graph_controller_1.registryGraphController.getGraphContext);
router.get('/graph/path', passport_1.default.authenticate('jwt', { session: false }), registry_graph_controller_1.registryGraphController.getGraphPath);
// ============================================================================
// BULK OPERATIONS
// ============================================================================
router.post('/bulk/impact/preview', passport_1.default.authenticate('jwt', { session: false }), registry_bulk_controller_1.registryBulkController.previewBulk);
router.post('/bulk/commit', passport_1.default.authenticate('jwt', { session: false }), registry_bulk_controller_1.registryBulkController.commitBulk);
// ============================================================================
// GOVERNANCE OBSERVABILITY
// ============================================================================
router.get('/governance/snapshot', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_governance_controller_1.registryGovernanceController.getSnapshot);
router.get('/governance/projection-map', passport_1.default.authenticate('jwt', { session: false }), registry_governance_controller_1.registryGovernanceController.getProjectionMap);
// ============================================================================
// POLICY SIMULATION
// ============================================================================
router.post('/simulation/diff', passport_1.default.authenticate('jwt', { session: false }), registry_simulation_controller_1.registrySimulationController.predictDiff);
// ============================================================================
// RELATIONSHIPS
// ============================================================================
router.post('/relationships', passport_1.default.authenticate('jwt', { session: false }), registry_relationship_controller_1.registryRelationshipController.create);
router.get('/relationships', 
// passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
registry_relationship_controller_1.registryRelationshipController.list);
// ============================================================================
// BOOTSTRAP (ADMIN ONLY)
// ============================================================================
router.post('/bootstrap', passport_1.default.authenticate('jwt', { session: false }), (req, res, next) => {
    const user = req.user;
    if (user.role !== 'ADMIN' && user.role !== 'REGISTRY_ADMIN') {
        res.status(403).json({ message: 'Forbidden: Requires REGISTRY_ADMIN' });
        return;
    }
    next();
}, registry_bootstrap_controller_1.registryBootstrapController.bootstrap);
exports.registryRouter = router;
exports.default = router;
