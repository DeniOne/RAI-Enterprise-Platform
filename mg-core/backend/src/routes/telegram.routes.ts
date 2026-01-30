import { Router } from 'express';
import telegramController from '../controllers/telegram.controller';
import passport from 'passport';

const router = Router();

// Webhook endpoint (no auth required - Telegram will call this)
router.post('/webhook', (req, res) => telegramController.webhook(req, res));

// Link Telegram account (requires authentication)
router.post(
    '/link',
    passport.authenticate('jwt', { session: false }),
    (req, res) => telegramController.linkAccount(req, res)
);

// Get bot status (requires authentication)
router.get(
    '/status',
    passport.authenticate('jwt', { session: false }),
    (req, res) => telegramController.getStatus(req, res)
);

export default router;
