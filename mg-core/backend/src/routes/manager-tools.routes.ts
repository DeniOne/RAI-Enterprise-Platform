import { Router } from 'express';
import { managerToolsController } from '../controllers/manager-tools.controller';

const router = Router();

// Kaizen Pipeline
router.post('/kaizen', managerToolsController.submitKaizen);
router.get('/kaizen/feed', managerToolsController.getKaizenFeed);
router.patch('/kaizen/:id/review', managerToolsController.reviewKaizen);

// Team Happiness (Aggregated)
router.get('/happiness', managerToolsController.getHappinessReport);

export default router;
