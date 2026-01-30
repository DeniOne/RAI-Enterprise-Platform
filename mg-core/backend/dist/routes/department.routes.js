"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("../controllers/department.controller");
const passport_1 = __importDefault(require("passport"));
const router = (0, express_1.Router)();
const departmentController = new department_controller_1.DepartmentController();
// Public routes (or protected if needed)
router.get('/', passport_1.default.authenticate('jwt', { session: false }), (req, res) => departmentController.getAll(req, res));
router.post('/', passport_1.default.authenticate('jwt', { session: false }), (req, res) => departmentController.create(req, res));
router.get('/:id', passport_1.default.authenticate('jwt', { session: false }), (req, res) => departmentController.getById(req, res));
router.get('/:id/kpi', passport_1.default.authenticate('jwt', { session: false }), (req, res) => departmentController.getKPI(req, res));
exports.default = router;
