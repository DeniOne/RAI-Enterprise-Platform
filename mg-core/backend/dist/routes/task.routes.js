"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const task_controller_1 = require("../controllers/task.controller");
const passport_1 = __importDefault(require("passport"));
const roles_middleware_1 = require("../middleware/roles.middleware");
const common_enums_1 = require("../dto/common/common.enums");
const router = (0, express_1.Router)();
const taskController = new task_controller_1.TaskController();
// RBAC: All endpoints protected per IMPLEMENTATION-CHECKLIST.md
// CREATE, READ, UPDATE: Employee+ (all authenticated roles)
// ASSIGN: Manager+ (ADMIN, HR_MANAGER, DEPARTMENT_HEAD)
const authenticateJwt = passport_1.default.authenticate('jwt', { session: false });
const requireEmployee = (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD, common_enums_1.UserRole.BRANCH_MANAGER, common_enums_1.UserRole.EMPLOYEE);
const requireManager = (0, roles_middleware_1.requireRoles)(common_enums_1.UserRole.ADMIN, common_enums_1.UserRole.HR_MANAGER, common_enums_1.UserRole.DEPARTMENT_HEAD);
router.post('/', authenticateJwt, requireEmployee, (req, res) => taskController.create(req, res));
router.get('/', authenticateJwt, requireEmployee, (req, res) => taskController.getAll(req, res));
router.get('/:id', authenticateJwt, requireEmployee, (req, res) => taskController.getById(req, res));
router.put('/:id', authenticateJwt, requireEmployee, (req, res) => taskController.update(req, res));
router.patch('/:id/status', authenticateJwt, requireEmployee, (req, res) => taskController.updateStatus(req, res));
router.post('/:id/assign', authenticateJwt, requireManager, (req, res) => taskController.assign(req, res));
exports.default = router;
