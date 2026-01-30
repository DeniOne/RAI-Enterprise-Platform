import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import passport from 'passport';
import { requireRoles } from '../middleware/roles.middleware';
import { UserRole } from '../dto/common/common.enums';

const router = Router();
const taskController = new TaskController();

// RBAC: All endpoints protected per IMPLEMENTATION-CHECKLIST.md
// CREATE, READ, UPDATE: Employee+ (all authenticated roles)
// ASSIGN: Manager+ (ADMIN, HR_MANAGER, DEPARTMENT_HEAD)

const authenticateJwt = passport.authenticate('jwt', { session: false });
const requireEmployee = requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD, UserRole.BRANCH_MANAGER, UserRole.EMPLOYEE);
const requireManager = requireRoles(UserRole.ADMIN, UserRole.HR_MANAGER, UserRole.DEPARTMENT_HEAD);

router.post('/', authenticateJwt, requireEmployee, (req, res) => taskController.create(req, res));
router.get('/', authenticateJwt, requireEmployee, (req, res) => taskController.getAll(req, res));
router.get('/:id', authenticateJwt, requireEmployee, (req, res) => taskController.getById(req, res));
router.put('/:id', authenticateJwt, requireEmployee, (req, res) => taskController.update(req, res));
router.patch('/:id/status', authenticateJwt, requireEmployee, (req, res) => taskController.updateStatus(req, res));
router.post('/:id/assign', authenticateJwt, requireManager, (req, res) => taskController.assign(req, res));

export default router;
