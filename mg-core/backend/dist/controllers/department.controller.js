"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const department_service_1 = __importDefault(require("@/core/org/department.service"));
const common_enums_1 = require("@/dto/common/common.enums");
class DepartmentController {
    async getAll(req, res) {
        try {
            const departments = await department_service_1.default.getAllDepartments();
            res.json(departments);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getById(req, res) {
        try {
            const department = await department_service_1.default.getDepartmentById(req.params.id);
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }
            res.json(department);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async create(req, res) {
        try {
            const department = await department_service_1.default.createDepartment(req.body);
            res.status(201).json(department);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
    async getKPI(req, res) {
        try {
            const period = req.query.period || common_enums_1.KPIPeriod.MONTHLY;
            const kpi = await department_service_1.default.getDepartmentKPI(req.params.id, period);
            res.json(kpi);
        }
        catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
exports.DepartmentController = DepartmentController;
