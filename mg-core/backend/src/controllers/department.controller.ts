import { Request, Response } from 'express';
import departmentService from '../services/department.service';
import { KPIPeriod } from '../dto/common/common.enums';

export class DepartmentController {
    async getAll(req: Request, res: Response) {
        try {
            const departments = await departmentService.getAllDepartments();
            res.json(departments);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const department = await departmentService.getDepartmentById(req.params.id);
            if (!department) {
                return res.status(404).json({ message: 'Department not found' });
            }
            res.json(department);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const department = await departmentService.createDepartment(req.body);
            res.status(201).json(department);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getKPI(req: Request, res: Response) {
        try {
            const period = (req.query.period as KPIPeriod) || KPIPeriod.MONTHLY;
            const kpi = await departmentService.getDepartmentKPI(req.params.id, period);
            res.json(kpi);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
