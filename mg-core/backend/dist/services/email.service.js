"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
class EmailService {
    static instance;
    logger = new common_1.Logger('EmailService');
    constructor() { }
    static getInstance() {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }
    /**
     * Send temporary password to employee
     * CANON: In MVP mode, we log the password to console/audit log for testing
     */
    async sendTemporaryPassword(email, password) {
        this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Welcome to MatrixGin | Body: Your temporary password is ${password}`);
        // TODO: Integrate with real SMTP/Mailgun/SendGrid in production phase
        // For now, it's a secure placeholder that respects the flow
    }
    /**
     * Send password setup link
     * SECURITY: Replaces raw password transmission
     */
    async sendPasswordSetupLink(email, token) {
        const link = `https://matrixgin.com/auth/set-password?token=${token}`;
        this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Set your MatrixGin Password | Link: ${link}`);
    }
    async sendEmail(to, subject, body) {
        this.logger.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} | Body: ${body}`);
    }
}
exports.EmailService = EmailService;
exports.default = EmailService.getInstance();
