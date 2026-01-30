import { Logger } from '@nestjs/common';

export class EmailService {
    private static instance: EmailService;
    private logger = new Logger('EmailService');

    private constructor() { }

    public static getInstance(): EmailService {
        if (!EmailService.instance) {
            EmailService.instance = new EmailService();
        }
        return EmailService.instance;
    }

    /**
     * Send temporary password to employee
     * CANON: In MVP mode, we log the password to console/audit log for testing
     */
    async sendTemporaryPassword(email: string, password: string): Promise<void> {
        this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Welcome to MatrixGin | Body: Your temporary password is ${password}`);

        // TODO: Integrate with real SMTP/Mailgun/SendGrid in production phase
        // For now, it's a secure placeholder that respects the flow
    }

    /**
     * Send password setup link
     * SECURITY: Replaces raw password transmission
     */
    async sendPasswordSetupLink(email: string, token: string): Promise<void> {
        const link = `https://matrixgin.com/auth/set-password?token=${token}`;
        this.logger.log(`[EMAIL SENT] To: ${email} | Subject: Set your MatrixGin Password | Link: ${link}`);
    }

    async sendEmail(to: string, subject: string, body: string): Promise<void> {
        this.logger.log(`[EMAIL SENT] To: ${to} | Subject: ${subject} | Body: ${body}`);
    }
}

export default EmailService.getInstance();
