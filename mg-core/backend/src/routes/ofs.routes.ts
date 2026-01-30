import { Router } from 'express';
import ofsController from '../controllers/ofs.controller';
import passport from 'passport';
import { requireRoles } from '../middleware/roles.middleware';
import { UserRole } from '../dto/common/common.enums';

const router = Router();

// =============================================================================
// RBAC Configuration for OFS
// =============================================================================
// READ: All authenticated users (Employee+)
// WRITE: HR_MANAGER, ADMIN only (structure modifications)
// =============================================================================

const authenticate = passport.authenticate('jwt', { session: false });
const requireHROrAdmin = requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER);

// =============================================================================
// Departments Management
// =============================================================================
router.get('/departments', authenticate, (req, res) => ofsController.getDepartments(req, res));
router.post('/departments', authenticate, requireHROrAdmin, (req, res) => ofsController.createDepartment(req, res));
router.put('/departments/:id', authenticate, requireHROrAdmin, (req, res) => ofsController.updateDepartment(req, res));
router.delete('/departments/:id', authenticate, requireHROrAdmin, (req, res) => ofsController.deleteDepartment(req, res));
router.post('/departments/:id/move', authenticate, requireHROrAdmin, (req, res) => ofsController.moveDepartment(req, res));

// =============================================================================
// Role Matrix Management
// =============================================================================
router.get('/role-matrix', authenticate, (req, res) => ofsController.getRoleMatrix(req, res));
router.post('/role-matrix', authenticate, requireHROrAdmin, (req, res) => ofsController.createRole(req, res));
router.put('/role-matrix/:id', authenticate, requireHROrAdmin, (req, res) => ofsController.updateRole(req, res));
router.delete('/role-matrix/:id', authenticate, requireHROrAdmin, (req, res) => ofsController.deleteRole(req, res));
router.post('/role-matrix/:roleId/assign', authenticate, requireHROrAdmin, (req, res) => ofsController.assignRole(req, res));

// =============================================================================
// Employee Management (OFS context)
// =============================================================================
router.get('/employees', authenticate, (req, res) => ofsController.getEmployees(req, res));
router.put('/employees/:id/competencies', authenticate, requireHROrAdmin, (req, res) => ofsController.updateEmployeeCompetencies(req, res));
router.post('/employees/:id/transfer', authenticate, requireHROrAdmin, (req, res) => ofsController.transferEmployee(req, res));

// =============================================================================
// Reporting Relationships
// =============================================================================
router.get('/reporting/:employeeId', authenticate, (req, res) => ofsController.getReportingRelationships(req, res));
router.post('/reporting', authenticate, requireHROrAdmin, (req, res) => ofsController.createReportingRelationship(req, res));

// =============================================================================
// Org Chart (READ ONLY)
// =============================================================================
router.get('/org-chart', authenticate, (req, res) => ofsController.getOrgChart(req, res));

// =============================================================================
// History & Audit (READ ONLY)
// =============================================================================
router.get('/history', authenticate, (req, res) => ofsController.getHistory(req, res));

// =============================================================================
// Reports (READ ONLY)
// =============================================================================
router.get('/reports/structure', authenticate, (req, res) => ofsController.getStructureReport(req, res));

// =============================================================================
// Pyramid of Interdependence
// =============================================================================
router.get('/pyramid', authenticate, (req, res) => ofsController.getPyramidRoles(req, res));
router.post('/pyramid', authenticate, requireHROrAdmin, (req, res) => ofsController.createPyramidRole(req, res));

// =============================================================================
// Triangle of Interdependence
// =============================================================================
router.get('/triangle', authenticate, (req, res) => ofsController.getTriangleAssignments(req, res));
router.post('/triangle/assign', authenticate, requireHROrAdmin, (req, res) => ofsController.assignTriangleRole(req, res));
router.get('/triangle/stats', authenticate, (req, res) => ofsController.getTriangleStats(req, res));

// =============================================================================
// 7-Level Organizational Hierarchy (READ ONLY)
// =============================================================================
router.get('/hierarchy/levels', authenticate, (req, res) => ofsController.getHierarchyLevels(req, res));
router.get('/hierarchy/structure', authenticate, (req, res) => ofsController.getHierarchyStructure(req, res));

// =============================================================================
// RACI Matrix
// =============================================================================
router.post('/raci', authenticate, requireHROrAdmin, (req, res) => ofsController.createRACIAssignment(req, res));
router.get('/raci/:projectName', authenticate, (req, res) => ofsController.getProjectRACI(req, res));

// =============================================================================
// Idea Channels (user can submit, but moderation is HR)
// =============================================================================
router.post('/ideas', authenticate, (req, res) => ofsController.submitIdea(req, res)); // Any authenticated user can submit
router.get('/ideas', authenticate, (req, res) => ofsController.getIdeas(req, res));

// =============================================================================
// Hybrid Team (Human + AI) — logging interactions
// =============================================================================
router.post('/hybrid/interaction', authenticate, (req, res) => ofsController.logHybridInteraction(req, res)); // Any user can log
router.get('/hybrid/stats', authenticate, (req, res) => ofsController.getHybridTeamStats(req, res));

// =============================================================================
// Locations & Positions dictionaries
// =============================================================================
router.get('/locations', authenticate, (req, res) => ofsController.getLocations(req, res));
router.get('/positions', authenticate, (req, res) => ofsController.getPositions(req, res));

export default router;
