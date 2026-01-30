import { ResolvedIntent } from '../intent';
import { MGChatResponse } from '../telegram';
import { mesService } from '../../mes/services/mes.service';
import { prisma } from '../../config/prisma';
import { growthMatrixService } from '../../services/growth-matrix.service';
import { managerToolsService } from '../../services/manager-tools.service';
import { universityService } from '../../services/university.service';
import { enrollmentService } from '../../services/enrollment.service';
import { qualificationService } from '../../services/qualification.service';

/**
 * Handle Employee scenarios (Execution contour)
 * 
 * SCOPE: "Me", Personal Data, Self-Improvement
 * PRIVACY: Only accesses data for the current user (intent.userId)
 */
export async function handleEmployeeScenario(action: string, intent: ResolvedIntent): Promise<MGChatResponse> {
    switch (action) {
        // ==========================================
        // SPRINT 11: Real Integrations
        // ==========================================
        case 'morning_greeting':
            return {
                text: '🌅 Доброе утро!\n\n(Данные загружаются...)\n\n📸 Твой ЦКП сегодня: Создать яркие воспоминания для гостей\n\n📊 Ориентир: 25+ компаний\n💰 Средняя ценность: цель 1500₽',
                actions: ['employee.show_my_shift', 'employee.daily_challenge']
            };

        case 'show_my_earnings':
            const earningsForecast = await mesService.getEarningsForecast(intent.userId);
            // Advisory Only: Shows data, suggests "Check Shift"
            return {
                text: `💰 ПРОГНОЗ ЗАРАБОТКА\n\nБаза: ${earningsForecast.baseSalary}₽\nБонус (Смена): ${earningsForecast.bonusPool}₽\n\nИтого: ~${earningsForecast.totalProjected}₽\n\n${earningsForecast.breakdown.message}`,
                actions: ['employee.show_my_shift', 'employee.show_my_kpi']
            };

        case 'show_my_shift':
            const shift = await mesService.getMyShiftProgress(intent.userId);
            // Advisory Only: Shows progress, suggests "Check Earnings"
            return {
                text: `📸 МОЯ СМЕНА\n\nКомпаний: ${shift.companiesCreated}\nПродано: ${shift.companiesSold}\nКонверсия: ${shift.conversion}%\nАктивные задачи: ${shift.activeTasks}`,
                actions: ['employee.show_my_earnings', 'employee.show_my_kpi']
            };

        case 'show_mc_balance':
            const wallet = await prisma.wallet.findUnique({ where: { user_id: intent.userId } });
            const balance = wallet ? Number(wallet.mc_balance) : 0;
            // NBA: Suggest spending
            return {
                text: `🪙 МОИ МАТРИКС КОИНЫ\n\nБаланс: ${balance} MC\n\n🛒 Магазин доступен!`,
                actions: ['employee.show_achievements']
            };

        case 'show_my_training':
            // Module 13: Corporate University Dashboard
            try {
                const dashboard = await universityService.getStudentDashboard(intent.userId);
                const userGrade = await prisma.userGrade.findUnique({ where: { user_id: intent.userId } });

                const activeCount = dashboard.enrollments.filter(e => e.status === 'ACTIVE').length;
                const completedCount = dashboard.enrollments.filter(e => e.status === 'COMPLETED').length;
                const currentGrade = userGrade?.current_grade || 'INTERN';

                return {
                    text: `📚 МОЁ ОБУЧЕНИЕ\n\n` +
                        `📊 Квалификация: ${currentGrade}\n` +
                        `📖 Активных курсов: ${activeCount}\n` +
                        `✅ Завершено: ${completedCount}\n\n` +
                        `Выбери действие:`,
                    actions: ['employee.show_my_courses', 'employee.show_my_qualification', 'employee.show_my_status_path']
                };
            } catch (error: any) {
                return {
                    text: `❌ Ошибка загрузки данных: ${error.message}`,
                    actions: ['employee.show_my_status_path']
                };
            }

        case 'show_my_courses':
            // Module 13: User's course list
            try {
                const coursesObj = await enrollmentService.getMyCourses(intent.userId);
                const allCourses = [...coursesObj.active, ...coursesObj.completed];

                if (allCourses.length === 0) {
                    return {
                        text: '📚 МОИ КУРСЫ\n\nУ тебя пока нет активных курсов.\n\nОбратись к руководителю для назначения обучения.',
                        actions: ['employee.show_my_training']
                    };
                }

                const courseList = allCourses.map(c => {
                    const status = c.status === 'COMPLETED' ? '✅' : c.status === 'ACTIVE' ? '📖' : '⏸️';
                    const progress = c.progress ? `${Math.round(c.progress)}%` : '0%';
                    return `${status} ${c.courseTitle} (${progress})`;
                }).join('\n');

                return {
                    text: `📚 МОИ КУРСЫ\n\n${courseList}`,
                    actions: ['employee.show_my_training', 'employee.show_my_qualification']
                };
            } catch (error: any) {
                return {
                    text: `❌ Ошибка загрузки курсов: ${error.message}`,
                    actions: ['employee.show_my_training']
                };
            }

        case 'show_my_qualification':
            // Module 13: Qualification level and progress
            try {
                const userGrade = await prisma.userGrade.findUnique({ where: { user_id: intent.userId } });
                const progress = await universityService.calculateProgressToNext(intent.userId);

                if (!userGrade) {
                    return {
                        text: '📊 КВАЛИФИКАЦИЯ\n\nДанные о квалификации не найдены.\n\nОбратись к руководителю.',
                        actions: ['employee.show_my_training']
                    };
                }

                const currentGrade = userGrade.current_grade;
                const nextGrade = progress?.nextGrade || 'MAX';
                const progressText = progress?.progress
                    ? `\n\n📈 Прогресс до ${nextGrade}: ${Math.round(progress.progress)}%\n\n${progress.message || ''}`
                    : '\n\nТы на максимальном уровне! 🏆';

                return {
                    text: `📊 МОЯ КВАЛИФИКАЦИЯ\n\nТекущий уровень: ${currentGrade}${progressText}`,
                    actions: ['employee.show_my_training', 'employee.show_my_courses']
                };
            } catch (error: any) {
                return {
                    text: `❌ Ошибка загрузки квалификации: ${error.message}`,
                    actions: ['employee.show_my_training']
                };
            }

        case 'growth_matrix':
            const pulse = await growthMatrixService.getGrowthPulse(intent.userId);
            const lines = pulse.map(p => `- ${p.axis}: ${p.value}%`).join('\n');
            return {
                text: `🧊 ТВОЯ МАТРИЦА РОСТА\n\n${lines}`,
                actions: ['employee.show_my_status_path']
            };

        // ==========================================
        // Legacy / Placeholders
        // ==========================================
        case 'show_my_schedule':
            return {
                text: '📅 Твой график на сегодня:\n\n09:00 - 18:00 (Офис)',
                actions: ['employee.show_my_tasks', 'employee.explain_status']
            };

        case 'show_my_tasks':
            return {
                text: '📋 Твои задачи:\n\n1. Завершить отчёт\n2. Проверить email',
                actions: ['employee.show_my_schedule', 'employee.guide_next_step']
            };

        case 'show_my_kpi':
            return {
                text: '📊 Твои показатели:\n\nПроизводительность: 95%\nКачество: 98%',
                actions: ['employee.explain_status']
            };

        case 'explain_status':
            return {
                text: '✅ Твой статус: Активен\n\nВсе задачи в порядке',
                actions: ['employee.show_my_kpi', 'employee.guide_next_step']
            };

        case 'guide_next_step':
            return {
                text: '➡️ Следующий шаг:\n\nЗавершить текущую задачу',
                actions: ['employee.show_my_tasks']
            };

        case 'show_my_status_path':
            return {
                text: '🌟 МОЙ СТАТУС\n\nСейчас: ⚡ ТОПЧИК (уровень 2 из 5)\nСледующий: 💎 КРЕМЕНЬ',
                actions: ['employee.show_my_training', 'employee.growth_matrix']
            };

        case 'daily_challenge':
            return {
                text: '🎯 ТВОЙ ВЫЗОВ НА СЕГОДНЯ\n\n(Заглушка)...',
                actions: ['employee.morning_greeting']
            };

        case 'need_help':
            return {
                text: '🆘 НУЖНА ПОМОЩЬ\n\n• [📞 Позвать наставника]\n• [🔧 Техническая проблема]\n• [👥 Сложный клиент]\n• [❓ Не понимаю задачу]',
                actions: ['employee.guide_next_step']
            };

        case 'show_achievements':
            return {
                text: '⭐ МОИ ДОСТИЖЕНИЯ\n\n(Заглушка)...',
                actions: ['employee.show_mc_balance']
            };

        case 'focus_mode':
            return {
                text: '🔇 РЕЖИМ ФОКУСА\n\n(Заглушка)...',
                actions: []
            };

        case 'suggest_improvement':
            // If text is provided in payload (e.g. from a prompt or specific command)
            const suggestionText = intent.payload?.text;

            if (!suggestionText) {
                return {
                    text: '💡 ПРЕДЛОЖИТЬ ИДЕЮ\n\nПожалуйста, опишите ваше предложение прямо в чате. Это может быть связано с процессами, качеством или комфортом работы.',
                    actions: ['employee.guide_next_step']
                };
            }

            try {
                await managerToolsService.submitKaizen(intent.userId, suggestionText);
                return {
                    text: '✅ Идея принята! Ваше предложение будет рассмотрено руководством. Спасибо за вклад в развитие MatrixGin! 🚀',
                    actions: ['employee.show_my_shift']
                };
            } catch (error: any) {
                return {
                    text: `❌ Ошибка при сохранении: ${error.message}`,
                    actions: ['employee.suggest_improvement']
                };
            }

        default:
            return {
                text: `Employee action не реализован: ${action}`,
                actions: []
            };
    }
}
