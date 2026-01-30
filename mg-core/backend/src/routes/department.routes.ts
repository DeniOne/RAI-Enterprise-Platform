import { Router } from 'express';
import { DepartmentController } from '../controllers/department.controller';
import passport from 'passport';

const router = Router();
const departmentController = new DepartmentController();

// Public routes (or protected if needed)
router.get('/', passport.authenticate('jwt', { session: false }), (req, res) => departmentController.getAll(req, res));
router.post('/', passport.authenticate('jwt', { session: false }), (req, res) => departmentController.create(req, res));
router.get('/:id', passport.authenticate('jwt', { session: false }), (req, res) => departmentController.getById(req, res));
router.get('/:id/kpi', passport.authenticate('jwt', { session: false }), (req, res) => departmentController.getKPI(req, res));

export default router;
