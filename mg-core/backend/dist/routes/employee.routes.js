"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const employee_controller_1 = require("../controllers/employee.controller");
const passport_1 = __importDefault(require("passport"));
const roles_middleware_1 = require("../middleware/roles.middleware");
const common_enums_1 = require("../dto/common/common.enums");
const router = (0, express_1.Router)();
const employeeController = new employee_controller_1.EmployeeController();
/**
 * Employee Routes
 * REMEDIATION: Removed emotional-tone route, replaced promote/demote with status update
 */
// Create employee - HR/Admin only
router.post('/', passport_1.default.authenticate('jwt', { session: false }), (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER), (req, res) => employeeController.create(req, res));
// Get employee by ID - all authenticated users (field-level ACL applied)
router.get('/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => employeeController.getById(req, res));
// Update employee - HR/Admin only
router.put('/:id', passport_1.default.authenticate('jwt', { session: false }), (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER), (req, res) => employeeController.update(req, res));
// Update employee status - HR/Admin only (explicit human decision)
router.patch('/:id/status', passport_1.default.authenticate('jwt', { session: false }), (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER), (req, res) => employeeController.updateStatus(req, res));
exports.default = router;
