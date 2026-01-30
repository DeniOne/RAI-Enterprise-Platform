import { ResolvedIntent } from '../intent';
import { MGChatResponse } from '../telegram';
import { adaptationService } from '../../services/adaptation.service';

/**
 * Handle Manager scenarios (Tactical Control contour)
 * 
 * SCOPE: "My Team", Aggregates, Tactical Decisions
 * PRIVACY: Accesses data only for direct subordinates of intent.userId
 */
export async function handleManagerScenario(action: string, intent: ResolvedIntent): Promise<MGChatResponse> {
    // CRITICAL: Ensure we rely on intent.userId (Context Security)
    const managerId = intent.userId;

    switch (action) {
        // ==========================================
        // SPRINT 11: Real Integrations (GAP Closure)
        // ==========================================
        case 'one_on_one_schedule':
            const status = await adaptationService.getMyAdaptationStatus(managerId); // Reuse logic or add specific manager method if needed
            // For managers, we likely want "My scheduled meetings as Manager"
            // adaptationService.getTeamStatus gives pendingMeetings
            const teamStatus = await adaptationService.getTeamStatus(managerId);
            const meetings = teamStatus.pendingMeetings.slice(0, 3).map(m => `- ${m.employee.first_name} ${m.employee.last_name} (${m.scheduled_at.toLocaleDateString()})`).join('\n') || 'Нет запланированных встреч';

            return {
                text: `🤝 Ближайшие 1-on-1:\n\n${meetings}`,
                actions: ['manager.show_team_overview']
            };

        case 'team_happiness':
            const happinessData = await adaptationService.getTeamStatus(managerId);
            const score = happinessData.teamHappiness.average;
            const trendText = score ? `${score}/10` : 'Недостаточно данных';
            const sessionCount = happinessData.teamHappiness.sessionCount;

            return {
                text: `❤️ Пульс команды:\n\nИндекс счастья: ${trendText}\n(На основе ${sessionCount} встреч)\n\n📍 _${happinessData.teamHappiness.label}_`,
                actions: ['manager.show_shift_status']
            };

        case 'mentee_list':
            const data = await adaptationService.getTeamStatus(managerId);
            const mentees = data.mentees.map(m => `- ${m.first_name} ${m.last_name}`).join('\n') || 'Нет активных стажёров';
            return {
                text: `🎓 Мои стажёры:\n\n${mentees}`,
                actions: ['manager.one_on_one_schedule']
            };

        // ==========================================
        // Legacy / Placeholders
        // ==========================================
        case 'show_shift_status':
            return {
                text: '👥 Статус смены:\n\nНа смене: 5 человек\nОтсутствуют: 2',
                actions: ['manager.show_absences', 'manager.show_team_overview']
            };

        case 'show_team_overview':
            return {
                text: '📊 Обзор команды:\n\nВсего: 12 человек\nАктивны: 10',
                actions: ['manager.show_shift_status', 'manager.show_absences']
            };

        case 'show_absences':
            return {
                text: '🏥 Отсутствия:\n\n- Иванов (больничный)\n- Петров (отпуск)',
                actions: ['manager.manage_shift_reassign']
            };

        case 'resolve_incident':
            return {
                text: '⚠️ Какой инцидент нужно решить?\n\nОтправьте номер инцидента',
                actions: ['manager.show_shift_status']
            };

        case 'manage_shift_reassign':
            return {
                text: '🔄 Переназначение смены:\n\nВыберите сотрудника',
                actions: ['manager.show_shift_status']
            };

        default:
            return {
                text: `Manager action не реализован: ${action}`,
                actions: []
            };
    }
}
