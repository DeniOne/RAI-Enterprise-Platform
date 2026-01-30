import { Router } from 'express';
import { registryBootstrapController } from './controllers/registry-bootstrap.controller';
import { registryRelationshipController } from './controllers/registry-relationship.controller';
import { registryImpactController } from './controllers/registry-impact.controller';
import { registrySchemaController } from './controllers/registry-schema.controller';
import { registryEntityController } from './controllers/registry-entity.controller';
import { registryFormController } from './controllers/registry-form.controller';
import { registryHistoryController } from './controllers/registry-history.controller';
import { registryGraphController } from './controllers/registry-graph.controller';
import { registryBulkController } from './controllers/registry-bulk.controller';
import { registryGovernanceController } from './controllers/registry-governance.controller';
import { registrySimulationController } from './controllers/registry-simulation.controller';
import passport from 'passport';

const router = Router();

// DEBUG: Runtime probe
console.log('[REGISTRY ROUTES] loaded at', new Date().toISOString());

// ============================================================================
// ENTITY CRUD ENDPOINTS (Core MVP)
// ============================================================================

// GET /entities — List entities by type (PUBLIC for dev)
// Query: ?type=urn:mg:type:role&limit=50&offset=0&search=
router.get(
    '/entities',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryEntityController.list
);

// GET /entities/:type/:id — Get single entity by type and id (PUBLIC for dev)
router.get(
    '/entities/:type/:id',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryEntityController.getById
);

// POST /entities — Create new entity (JWT REQUIRED)
router.post(
    '/entities',
    passport.authenticate('jwt', { session: false }),
    registryEntityController.create
);

// PATCH /entities/:type/:id — Partial update (JWT REQUIRED)
router.patch(
    '/entities/:type/:id',
    passport.authenticate('jwt', { session: false }),
    registryEntityController.partialUpdate
);

// PUT /entities/:urn — Full update (JWT REQUIRED)
router.put(
    '/entities/:urn',
    passport.authenticate('jwt', { session: false }),
    registryEntityController.update
);

// POST /entities/:type/:id/lifecycle — Lifecycle transition (JWT REQUIRED)
router.post(
    '/entities/:type/:id/lifecycle',
    passport.authenticate('jwt', { session: false }),
    registryEntityController.lifecycle
);

// GET /entities/:type/:id/audit — Audit log (PUBLIC for dev)
router.get(
    '/entities/:type/:id/audit',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryEntityController.audit
);

// ============================================================================
// SCHEMA ENDPOINTS
// ============================================================================

// GET /schema/:entityTypeUrn — Get schema for entity type (PUBLIC for dev)
router.get(
    '/schema/:entityTypeUrn',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registrySchemaController.getSchema
);

// ============================================================================
// FORM PROJECTION
// ============================================================================

// GET /entities/form-projection — Form layout/schema (PUBLIC for dev)
router.get(
    '/form-projection',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryFormController.getProjection
);

// ============================================================================
// HISTORY & SNAPSHOTS
// ============================================================================

router.get(
    '/history/:urn',
    passport.authenticate('jwt', { session: false }),
    registryHistoryController.getHistory
);

router.get(
    '/snapshots/:urn/:snapshotId',
    passport.authenticate('jwt', { session: false }),
    registryHistoryController.getSnapshot
);

// ============================================================================
// GRAPH TRAVERSAL
// ============================================================================

router.get(
    '/graph/context/:urn',
    passport.authenticate('jwt', { session: false }),
    registryGraphController.getGraphContext
);

router.get(
    '/graph/path',
    passport.authenticate('jwt', { session: false }),
    registryGraphController.getGraphPath
);

// ============================================================================
// BULK OPERATIONS
// ============================================================================

router.post(
    '/bulk/impact/preview',
    passport.authenticate('jwt', { session: false }),
    registryBulkController.previewBulk
);

router.post(
    '/bulk/commit',
    passport.authenticate('jwt', { session: false }),
    registryBulkController.commitBulk
);

// ============================================================================
// GOVERNANCE OBSERVABILITY
// ============================================================================

router.get(
    '/governance/snapshot',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryGovernanceController.getSnapshot
);

router.get(
    '/governance/projection-map',
    passport.authenticate('jwt', { session: false }),
    registryGovernanceController.getProjectionMap
);

// ============================================================================
// POLICY SIMULATION
// ============================================================================

router.post(
    '/simulation/diff',
    passport.authenticate('jwt', { session: false }),
    registrySimulationController.predictDiff
);

// ============================================================================
// RELATIONSHIPS
// ============================================================================

router.post(
    '/relationships',
    passport.authenticate('jwt', { session: false }),
    registryRelationshipController.create
);

router.get(
    '/relationships',
    // passport.authenticate('jwt', { session: false }), // TODO: [DEV-ONLY] Re-enable
    registryRelationshipController.list
);

// ============================================================================
// BOOTSTRAP (ADMIN ONLY)
// ============================================================================

router.post(
    '/bootstrap',
    passport.authenticate('jwt', { session: false }),
    (req, res, next) => {
        const user = req.user as any;
        if (user.role !== 'ADMIN' && user.role !== 'REGISTRY_ADMIN') {
            res.status(403).json({ message: 'Forbidden: Requires REGISTRY_ADMIN' });
            return;
        }
        next();
    },
    registryBootstrapController.bootstrap
);

export const registryRouter = router;
export default router;
