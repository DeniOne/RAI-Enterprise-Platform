import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import passport from 'passport';
import { requireRoles } from '../middleware/roles.middleware';
import { UserRole } from '../dto/common/common.enums';

const router = Router();
const employeeController = new EmployeeController();

/**
 * Employee Routes
 * REMEDIATION: Removed emotional-tone route, replaced promote/demote with status update
 */

// Create employee - HR/Admin only
router.post('/',
    passport.authenticate('jwt', { session: false }),
    requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER),
    (req, res) => employeeController.create(req, res)
);

// Get employee by ID - all authenticated users (field-level ACL applied)
router.get('/:id',
    passport.authenticate('jwt', { session: false }),
    (req, res) => employeeController.getById(req, res)
);

// Update employee - HR/Admin only
router.put('/:id',
    passport.authenticate('jwt', { session: false }),
    requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER),
    (req, res) => employeeController.update(req, res)
);

// Update employee status - HR/Admin only (explicit human decision)
router.patch('/:id/status',
    passport.authenticate('jwt', { session: false }),
    requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER),
    (req, res) => employeeController.updateStatus(req, res)
);

export default router;
