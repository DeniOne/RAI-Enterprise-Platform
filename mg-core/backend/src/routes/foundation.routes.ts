import { Router } from 'express';
import { foundationController } from '../controllers/foundation.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Foundation is a system gate, requires basic authentication
router.use(authenticate);

router.get('/status', (req, res) => foundationController.getStatus(req, res));
router.post('/block-viewed', (req, res) => foundationController.markBlockViewed(req, res));
router.post('/decision', (req, res) => foundationController.submitDecision(req, res));

export default router;
