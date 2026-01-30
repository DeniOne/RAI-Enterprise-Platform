"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res) {
        try {
            const dto = req.body;
            const result = await authService.register(dto);
            res.status(201).json(result);
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    async login(req, res) {
        try {
            const dto = req.body;
            const result = await authService.login(dto);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
    async me(req, res) {
        // User is attached to req.user by passport middleware
        res.json(req.user);
    }
    async refresh(req, res) {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            const result = await authService.refresh(refreshToken);
            res.status(200).json(result);
        }
        catch (error) {
            // Always return generic 401 - no details per MODULE 01 canon
            res.status(401).json({ message: 'Unauthorized' });
        }
    }
    async logout(req, res) {
        // User is attached by passport middleware - we just log the intent
        const user = req.user;
        if (user?.id) {
            await authService.logout(user.id);
        }
        res.status(200).json({ message: 'OK' });
    }
    async changePassword(req, res) {
        try {
            const user = req.user;
            const { currentPassword, newPassword } = req.body;
            if (!user?.id)
                return res.status(401).json({ message: 'Unauthorized' });
            await authService.changePassword(user.id, currentPassword, newPassword);
            res.status(200).json({ message: 'Password changed successfully' });
        }
        catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
    /**
     * Start Telegram login process.
     */
    async initTelegramLogin(req, res) {
        try {
            const { username } = req.body;
            if (!username)
                return res.status(400).json({ message: 'Username is required' });
            const result = await authService.initTelegramLogin(username);
            res.status(200).json(result);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
    /**
     * Check Telegram login status (Polling).
     */
    async verifyTelegramLogin(req, res) {
        try {
            const { sessionId } = req.params;
            if (!sessionId)
                return res.status(400).json({ message: 'Session ID is required' });
            const result = await authService.verifyTelegramLogin(sessionId);
            if (result) {
                res.status(200).json(result);
            }
            else {
                res.status(202).json({ message: 'Pending approval' });
            }
        }
        catch (error) {
            res.status(401).json({ message: error.message });
        }
    }
}
exports.AuthController = AuthController;
