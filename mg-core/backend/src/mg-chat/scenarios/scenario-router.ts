/**
 * Scenario Router (Step 4)
 * 
 * Routes resolved intents to appropriate backend scenarios.
 * 
 * WHY THIS EXISTS:
 * - Intent Resolver gives us WHAT user wants
 * - Scenario Router decides HOW to fulfill it
 * - Connects MG Chat Core to MatrixGin backend
 * 
 * ARCHITECTURE:
 * - Intent Namespace = Management Contour
 * - employee.* → Employee scenarios
 * - manager.* → Manager scenarios
 * - exec.* → Executive scenarios
 * 
 * RULES:
 * - NO business logic (that's in backend)
 * - ONLY routing and API calls
 * - Returns MGChatResponse
 */

import { ResolvedIntent } from '../intent';
import { MGChatResponse } from '../telegram';
import { handleEmployeeScenario } from './employee.scenario';
import { handleManagerScenario } from './manager.scenario';

/**
 * Route intent to appropriate scenario.
 * 
 * This is where Intent Namespaces become technical reality.
 */
export async function routeScenario(intent: ResolvedIntent): Promise<MGChatResponse> {
    const [namespace, action] = intent.intentId.split('.');

    switch (namespace) {
        case 'employee':
            return handleEmployeeScenario(action, intent);
        case 'manager':
            return handleManagerScenario(action, intent);
        case 'exec':
            return handleExecutiveScenario(action, intent);
        default:
            return {
                text: `Неизвестный namespace: ${namespace}`,
                actions: []
            };
    }
}

// Handlers moved to ./employee.scenario.ts and ./manager.scenario.ts

/**
 * Handle Executive scenarios (Signal/Navigate contour)
 * 
 * WHY: Executive intents are about "system" — signals, no actions
 */
function handleExecutiveScenario(action: string, intent: ResolvedIntent): MGChatResponse {
    switch (action) {
        case 'show_system_health':
            // TODO: Call /api/system/health
            return {
                text: '🏥 Здоровье системы:\n\n✅ Все сервисы работают\n✅ Нет критических отклонений',
                actions: ['exec.show_kpi_summary', 'exec.explain_risk']
            };

        case 'show_kpi_summary':
            // TODO: Call /api/kpi/summary
            return {
                text: '📊 Сводка KPI:\n\nПроизводительность: 92%\nУдовлетворённость: 88%',
                actions: ['exec.explain_risk', 'exec.navigate_dashboard']
            };

        case 'explain_risk':
            // TODO: Call /api/risks/current
            return {
                text: '⚠️ Анализ рисков:\n\nНизкий риск: Все показатели в норме',
                actions: ['exec.show_system_health', 'exec.navigate_dashboard']
            };

        case 'navigate_dashboard':
            // TODO: Return dashboard link
            return {
                text: '📊 Дашборд:\n\nhttps://matrixgin.local/dashboard',
                actions: ['exec.show_system_health', 'exec.show_kpi_summary']
            };

        default:
            return {
                text: `Executive action не реализован: ${action}`,
                actions: []
            };
    }
}
