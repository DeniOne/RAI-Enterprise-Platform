import { Router } from 'express';
import { EconomyController } from '../controllers/economy.controller';
import passport from 'passport';
import { requireRoles } from '../middleware/roles.middleware';
import { UserRole } from '../dto/common/common.enums';

const router = Router();
const economyController = new EconomyController();

router.get('/wallet', passport.authenticate('jwt', { session: false }), (req, res) => economyController.getWallet(req, res));
router.post('/transfer', passport.authenticate('jwt', { session: false }), (req, res) => economyController.transfer(req, res));
router.get('/transactions', passport.authenticate('jwt', { session: false }), (req, res) => economyController.getTransactions(req, res));

export default router;
