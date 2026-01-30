import { Router } from 'express';
import { adaptationController } from '../controllers/adaptation.controller';
import { growthMatrixController } from '../controllers/growth-matrix.controller';

const router = Router();

// Adaptation & Mentorship
router.get('/my', (req, res) => adaptationController.getMyStatus(req, res));
router.post('/1on1', (req, res) => adaptationController.create1on1(req, res));
router.patch('/1on1/:id/complete', (req, res) => adaptationController.complete1on1(req, res));
router.get('/team-status', (req, res) => adaptationController.getTeamStatus(req, res));

// Growth Matrix
router.get('/pulse', (req, res) => growthMatrixController.getMyPulse(req, res));

export default router;
