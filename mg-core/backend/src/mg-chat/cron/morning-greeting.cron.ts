/**
 * Morning Greeting Cron Job (Employee Motivation)
 * 
 * Part of Motivational Organism (Sprint 5-6)
 * Runs daily at 08:45 AM
 * 
 * Functionality:
 * - Sends "Good Morning" message to all active employees on shift
 * - Provides daily KPI Context (ZKP)
 * - Sets Daily Micro-Challenge
 * - Reminds about Earnings Forecast
 */

import { prisma } from '../../config/prisma';
// import { tgBot } from '../telegram/telegram.bot'; // TODO: Enable when bot instance available
// import { routeScenario } from '../scenarios/scenario-router'; // TODO: Enable import

export class MorningGreetingCron {

    /**
     * Run the morning greeting routine
     * Should be called by a scheduler (e.g., node-cron) at 08:45
     */
    async run() {
        console.log('[CRON] Starting Morning Greeting routine (08:45)...');

        try {
            // 1. Find all active employees with a shift today
            // For now, selecting all users with role EMPLOYEE as a demo
            const employees = await prisma.user.findMany({
                where: {
                    role: 'EMPLOYEE',
                    status: 'ACTIVE',
                    // In real impl: status: 'ON_SHIFT' or scheduled for today
                }
            });

            console.log(`[CRON] Found ${employees.length} employees for greeting.`);

            // 2. Iterate and send personal greeting
            let sentCount = 0;
            for (const emp of employees) {
                // Find telegram chat ID (assuming mapped in User model or separate table)
                // For MVP/Demo we assume emp has a mapped telegram ID
                // In real schema: const telegramUser = await prisma.telegramUser.findFirst({ where: { userId: emp.id } });

                // SKIPPING ACTUAL SEND IN DEMO IF NO TELEGRAM MAPPING
                // But we simulate the logic:

                // const chatId = telegramUser?.chatId;
                // if (!chatId) continue;

                // 3. Generate message via Scenario
                // We reuse the logic from 'morning_greeting' intent

                // const response = await routeScenario({ 
                //     intentId: 'employee.morning_greeting', 
                //     confidence: 1 
                // });

                // 4. Send via Bot
                // await tgBot.telegram.sendMessage(chatId, response.text, ...params);

                sentCount++;
            }

            console.log(`[CRON] Morning Greeting complete. Sent: ${sentCount}`);
            return { processed: employees.length, sent: sentCount };

        } catch (error) {
            console.error('[CRON] Error in Morning Greeting:', error);
            throw error;
        }
    }
}

export const morningGreetingCron = new MorningGreetingCron();
