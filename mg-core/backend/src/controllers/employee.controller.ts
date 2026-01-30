import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { filterEmployeeByRole } from '../services/employee-acl.service';

const employeeService = new EmployeeService();

/**
 * Employee Controller
 * REMEDIATION: Removed emotional analytics, promote/demote replaced with updateStatus
 */
export class EmployeeController {
    async create(req: Request, res: Response) {
        try {
            const employee = await employeeService.createEmployee(req.body);
            const user = req.user as any;
            const filtered = filterEmployeeByRole(employee, user?.role);
            res.status(201).json(filtered);
        } catch (error: any) {
            if (error.message === 'User not found' || error.message === 'Department not found') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'User is already an employee') {
                return res.status(409).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async getById(req: Request, res: Response) {
        try {
            const employee = await employeeService.getEmployeeById(req.params.id);
            if (!employee) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            // Field-level access control
            const user = req.user as any;
            const filtered = filterEmployeeByRole(employee, user?.role);

            // Audit log for reading personal data
            await employeeService.logRead(user?.id, req.params.id, 'employee_profile');

            res.json(filtered);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const employee = await employeeService.updateEmployee(req.params.id, req.body);
            const user = req.user as any;
            const filtered = filterEmployeeByRole(employee, user?.role);
            res.json(filtered);
        } catch (error) {
            res.status(500).json({ message: 'Internal server error' });
        }
    }

    /**
     * Update employee status
     * Replaces promote/demote - requires explicit human decision
     * No automatic logic, no evaluation
     */
    async updateStatus(req: Request, res: Response) {
        try {
            const { status } = req.body;
            if (!status) {
                return res.status(400).json({ message: 'Status is required' });
            }
            const employee = await employeeService.updateStatus(req.params.id, status);
            const user = req.user as any;
            const filtered = filterEmployeeByRole(employee, user?.role);
            res.json(filtered);
        } catch (error: any) {
            if (error.message === 'Employee not found') {
                return res.status(404).json({ message: error.message });
            }
            if (error.message === 'Invalid status') {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: 'Internal server error' });
        }
    }
}
