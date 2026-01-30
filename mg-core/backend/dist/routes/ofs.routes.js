"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ofs_controller_1 = __importDefault(require("../controllers/ofs.controller"));
const passport_1 = __importDefault(require("passport"));
const roles_middleware_1 = require("../middleware/roles.middleware");
const common_enums_1 = require("../dto/common/common.enums");
const router = (0, express_1.Router)();
// =============================================================================
// RBAC Configuration for OFS
// =============================================================================
// READ: All authenticated users (Employee+)
// WRITE: HR_MANAGER, ADMIN only (structure modifications)
// =============================================================================
const authenticate = passport_1.default.authenticate('jwt', { session: false });
const requireHROrAdmin = (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER);
// =============================================================================
// Departments Management
// =============================================================================
router.get('/departments', authenticate, (req, res) => ofs_controller_1.default.getDepartments(req, res));
router.post('/departments', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.createDepartment(req, res));
router.put('/departments/:id', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.updateDepartment(req, res));
router.delete('/departments/:id', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.deleteDepartment(req, res));
router.post('/departments/:id/move', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.moveDepartment(req, res));
// =============================================================================
// Role Matrix Management
// =============================================================================
router.get('/role-matrix', authenticate, (req, res) => ofs_controller_1.default.getRoleMatrix(req, res));
router.post('/role-matrix', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.createRole(req, res));
router.put('/role-matrix/:id', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.updateRole(req, res));
router.delete('/role-matrix/:id', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.deleteRole(req, res));
router.post('/role-matrix/:roleId/assign', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.assignRole(req, res));
// =============================================================================
// Employee Management (OFS context)
// =============================================================================
router.get('/employees', authenticate, (req, res) => ofs_controller_1.default.getEmployees(req, res));
router.put('/employees/:id/competencies', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.updateEmployeeCompetencies(req, res));
router.post('/employees/:id/transfer', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.transferEmployee(req, res));
// =============================================================================
// Reporting Relationships
// =============================================================================
router.get('/reporting/:employeeId', authenticate, (req, res) => ofs_controller_1.default.getReportingRelationships(req, res));
router.post('/reporting', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.createReportingRelationship(req, res));
// =============================================================================
// Org Chart (READ ONLY)
// =============================================================================
router.get('/org-chart', authenticate, (req, res) => ofs_controller_1.default.getOrgChart(req, res));
// =============================================================================
// History & Audit (READ ONLY)
// =============================================================================
router.get('/history', authenticate, (req, res) => ofs_controller_1.default.getHistory(req, res));
// =============================================================================
// Reports (READ ONLY)
// =============================================================================
router.get('/reports/structure', authenticate, (req, res) => ofs_controller_1.default.getStructureReport(req, res));
// =============================================================================
// Pyramid of Interdependence
// =============================================================================
router.get('/pyramid', authenticate, (req, res) => ofs_controller_1.default.getPyramidRoles(req, res));
router.post('/pyramid', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.createPyramidRole(req, res));
// =============================================================================
// Triangle of Interdependence
// =============================================================================
router.get('/triangle', authenticate, (req, res) => ofs_controller_1.default.getTriangleAssignments(req, res));
router.post('/triangle/assign', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.assignTriangleRole(req, res));
router.get('/triangle/stats', authenticate, (req, res) => ofs_controller_1.default.getTriangleStats(req, res));
// =============================================================================
// 7-Level Organizational Hierarchy (READ ONLY)
// =============================================================================
router.get('/hierarchy/levels', authenticate, (req, res) => ofs_controller_1.default.getHierarchyLevels(req, res));
router.get('/hierarchy/structure', authenticate, (req, res) => ofs_controller_1.default.getHierarchyStructure(req, res));
// =============================================================================
// RACI Matrix
// =============================================================================
router.post('/raci', authenticate, requireHROrAdmin, (req, res) => ofs_controller_1.default.createRACIAssignment(req, res));
router.get('/raci/:projectName', authenticate, (req, res) => ofs_controller_1.default.getProjectRACI(req, res));
// =============================================================================
// Idea Channels (user can submit, but moderation is HR)
// =============================================================================
router.post('/ideas', authenticate, (req, res) => ofs_controller_1.default.submitIdea(req, res)); // Any authenticated user can submit
router.get('/ideas', authenticate, (req, res) => ofs_controller_1.default.getIdeas(req, res));
// =============================================================================
// Hybrid Team (Human + AI) — logging interactions
// =============================================================================
router.post('/hybrid/interaction', authenticate, (req, res) => ofs_controller_1.default.logHybridInteraction(req, res)); // Any user can log
router.get('/hybrid/stats', authenticate, (req, res) => ofs_controller_1.default.getHybridTeamStats(req, res));
exports.default = router;
