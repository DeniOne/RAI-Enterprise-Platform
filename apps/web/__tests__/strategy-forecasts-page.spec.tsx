import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StrategyForecastsPage from '../app/(app)/strategy/forecasts/page';

const listSeasonsMock = jest.fn();
const runStrategyForecastMock = jest.fn();
const historyStrategyForecastMock = jest.fn();
const listStrategyScenariosMock = jest.fn();
const saveStrategyScenarioMock = jest.fn();
const deleteStrategyScenarioMock = jest.fn();
const submitFeedbackStrategyForecastMock = jest.fn();

jest.mock('@/lib/feature-flags', () => ({
    webFeatureFlags: {
        strategyForecasts: true,
    },
}));

jest.mock('@/lib/api', () => ({
    api: {
        seasons: {
            list: (...args: unknown[]) => listSeasonsMock(...args),
        },
        ofs: {
            strategyForecasts: {
                run: (...args: unknown[]) => runStrategyForecastMock(...args),
                history: (...args: unknown[]) => historyStrategyForecastMock(...args),
                listScenarios: (...args: unknown[]) => listStrategyScenariosMock(...args),
                saveScenario: (...args: unknown[]) => saveStrategyScenarioMock(...args),
                deleteScenario: (...args: unknown[]) => deleteStrategyScenarioMock(...args),
                submitFeedback: (...args: unknown[]) => submitFeedbackStrategyForecastMock(...args),
            },
        },
    },
}));

describe('StrategyForecastsPage', () => {
    beforeEach(() => {
        listSeasonsMock.mockReset();
        runStrategyForecastMock.mockReset();
        historyStrategyForecastMock.mockReset();
        listStrategyScenariosMock.mockReset();
        saveStrategyScenarioMock.mockReset();
        deleteStrategyScenarioMock.mockReset();
        submitFeedbackStrategyForecastMock.mockReset();
        window.localStorage.clear();
        listSeasonsMock.mockResolvedValue({
            data: [
                {
                    id: 'season-1',
                    year: 2026,
                    status: 'ACTIVE',
                },
            ],
        });
        historyStrategyForecastMock.mockResolvedValue({
            data: {
                items: [],
                total: 0,
                limit: 6,
                offset: 0,
                hasMore: false,
            },
        });
        listStrategyScenariosMock.mockResolvedValue({ data: [] });
        deleteStrategyScenarioMock.mockResolvedValue({ data: { ok: true } });
        submitFeedbackStrategyForecastMock.mockResolvedValue({
            data: {
                id: 'run-1',
                traceId: 'di_1',
                scopeLevel: 'company',
                seasonId: 'season-1',
                horizonDays: 90,
                domains: ['finance'],
                degraded: false,
                riskTier: 'medium',
                recommendedAction: 'Сохранять базовый план',
                scenarioName: null,
                createdByUserId: null,
                createdAt: '2026-03-12T10:00:00.000Z',
                evaluation: {
                    status: 'feedback_recorded',
                    revenueErrorPct: 2.1,
                },
            },
        });
    });

    it('saves and restores a persisted scenario snapshot', async () => {
        const user = userEvent.setup();
        saveStrategyScenarioMock.mockImplementation(async (payload: Record<string, unknown>) => ({
            data: {
                id: 'scenario-1',
                createdAt: '2026-03-12T10:00:00.000Z',
                updatedAt: '2026-03-12T10:00:00.000Z',
                createdByUserId: null,
                ...payload,
            },
        }));

        render(<StrategyForecastsPage />);

        await waitFor(() => {
            expect(listSeasonsMock).toHaveBeenCalled();
            expect(listStrategyScenariosMock).toHaveBeenCalled();
            expect(historyStrategyForecastMock).toHaveBeenCalled();
        });

        await user.clear(screen.getByLabelText('Название сценария'));
        await user.type(screen.getByLabelText('Название сценария'), 'Сценарий роста');
        await user.type(screen.getByLabelText('Цена реализации, %'), '12');
        await user.type(screen.getByLabelText('Операционные расходы, %'), '-4');

        await user.click(screen.getByRole('button', { name: /Сохранить сценарий/i }));
        await user.click(screen.getByRole('button', { name: 'Сценарии' }));

        await waitFor(() => {
            expect(saveStrategyScenarioMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Сценарий роста',
                    seasonId: 'season-1',
                }),
            );
        });
        expect((await screen.findAllByText('Сценарий роста')).length).toBeGreaterThan(1);
        expect(screen.getByText(/сохранено/i)).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Название сценария'));
        await user.type(screen.getByLabelText('Название сценария'), 'Черновик');
        await user.clear(screen.getByLabelText('Цена реализации, %'));
        await user.clear(screen.getByLabelText('Операционные расходы, %'));

        const loadButtons = screen.getAllByRole('button', { name: /Загрузить/i });
        await user.click(loadButtons[0]);

        expect(screen.getByLabelText('Название сценария')).toHaveValue('Сценарий роста');
        expect(screen.getByLabelText('Цена реализации, %')).toHaveValue(12);
        expect(screen.getByLabelText('Операционные расходы, %')).toHaveValue(-4);
    });

    it('renders optimization preview after forecast run', async () => {
        const user = userEvent.setup();
        runStrategyForecastMock.mockResolvedValue({
            data: {
                traceId: 'di_123',
                degraded: false,
                degradationReasons: [],
                lineage: [],
                baseline: {
                    revenue: 1200000,
                    margin: 340000,
                    cashFlow: 250000,
                    riskScore: 38.2,
                    yield: 4.8,
                },
                range: {
                    revenue: { p10: 1100000, p50: 1200000, p90: 1300000 },
                    margin: { p10: 300000, p50: 340000, p90: 390000 },
                    cashFlow: { p10: 180000, p50: 250000, p90: 320000 },
                    yield: { p10: 4.4, p50: 4.8, p90: 5.2 },
                },
                scenarioDelta: {
                    revenue: 80000,
                    margin: 45000,
                    cashFlow: 25000,
                    riskScore: -1.5,
                    yield: 0.2,
                },
                drivers: [],
                recommendedAction: 'Сценарий можно брать в shortlist.',
                tradeoff: 'Сохраняем баланс между cash flow и ростом.',
                limitations: ['MVP'],
                evidence: ['budget', 'liquidity'],
                riskTier: 'medium',
                optimizationPreview: {
                    objective: 'Максимизировать маржу и cash flow без выхода за допустимый риск.',
                    planningHorizon: '90 дней',
                    constraints: ['Горизонт планирования: 90 дней'],
                    recommendations: [
                        {
                            action: 'Поднять текущий сценарий в shortlist для исполнения и подготовить управленческое подтверждение.',
                            expectedImpact: 'Ожидаемый delta по марже +45 000 ₽ при нейтральном риске.',
                            confidence: 'medium',
                        },
                    ],
                },
            },
        });
        historyStrategyForecastMock.mockResolvedValue({
            data: {
                items: [
                    {
                        id: 'run-1',
                        traceId: 'di_123',
                        scopeLevel: 'company',
                        seasonId: 'season-1',
                        horizonDays: 90,
                        domains: ['agro', 'economics', 'finance', 'risk'],
                        degraded: false,
                        riskTier: 'medium',
                        recommendedAction: 'Сценарий можно брать в shortlist.',
                        scenarioName: 'Рабочий сценарий',
                        createdAt: '2026-03-12T10:00:00.000Z',
                        createdByUserId: null,
                        evaluation: {
                            status: 'pending',
                        },
                    },
                ],
                total: 1,
                limit: 6,
                offset: 0,
                hasMore: false,
            },
        });

        render(<StrategyForecastsPage />);

        await waitFor(() => {
            expect(listSeasonsMock).toHaveBeenCalled();
        });

        await user.click(screen.getByRole('button', { name: /Построить прогноз/i }));
        await waitFor(() => {
            expect(runStrategyForecastMock).toHaveBeenCalled();
        });

        await user.click(screen.getByRole('button', { name: 'Оптимизация' }));

        expect((await screen.findAllByText(/Максимизировать маржу и cash flow/i)).length).toBeGreaterThan(0);
        expect(screen.getByText(/shortlist для исполнения/i)).toBeInTheDocument();
        expect(screen.getByText(/Baseline run|Рабочий сценарий/i)).toBeInTheDocument();
    });

    it('submits realized feedback from recent runs panel', async () => {
        const user = userEvent.setup();

        historyStrategyForecastMock.mockResolvedValue({
            data: {
                items: [
                    {
                        id: 'run-1',
                        traceId: 'di_1',
                        scopeLevel: 'company',
                        seasonId: 'season-1',
                        horizonDays: 90,
                        domains: ['finance'],
                        degraded: false,
                        riskTier: 'medium',
                        recommendedAction: 'Сохранять базовый план',
                        scenarioName: null,
                        createdByUserId: null,
                        createdAt: '2026-03-12T10:00:00.000Z',
                        evaluation: {
                            status: 'pending',
                        },
                    },
                ],
                total: 1,
                limit: 6,
                offset: 0,
                hasMore: false,
            },
        });

        render(<StrategyForecastsPage />);

        await waitFor(() => {
            expect(historyStrategyForecastMock).toHaveBeenCalled();
        });

        await user.click(await screen.findByRole('button', { name: 'Записать факт' }));
        await user.type(screen.getByPlaceholderText('Фактическая выручка (RUB)'), '1000000');
        await user.type(screen.getByPlaceholderText('Фактическая маржа (RUB)'), '280000');
        await user.type(screen.getByPlaceholderText('Фактический денежный поток (RUB)'), '190000');
        await user.type(screen.getByPlaceholderText('Фактическая урожайность'), '4.3');
        await user.type(screen.getByPlaceholderText('Комментарий (опционально)'), 'Факт по закрытию периода');
        await user.click(screen.getByRole('button', { name: 'Сохранить' }));

        await waitFor(() => {
            expect(submitFeedbackStrategyForecastMock).toHaveBeenCalledWith('run-1', {
                actualRevenue: 1000000,
                actualMargin: 280000,
                actualCashFlow: 190000,
                actualYield: 4.3,
                note: 'Факт по закрытию периода',
            });
        });

        expect(await screen.findByText(/Отклонение факта: выручка \+2.1%/i)).toBeInTheDocument();
    });

    it('applies history filters and paginates recent runs', async () => {
        const user = userEvent.setup();

        historyStrategyForecastMock.mockImplementation(
            async (query: {
                limit?: number;
                offset?: number;
                seasonId?: string;
                riskTier?: 'low' | 'medium' | 'high';
                degraded?: boolean;
            } = {}) => {
                const limit = query.limit ?? 6;
                const offset = query.offset ?? 0;

                if (query.riskTier === 'high') {
                    return {
                        data: {
                            items: [
                                {
                                    id: 'run-high',
                                    traceId: 'di_high',
                                    scopeLevel: 'company',
                                    seasonId: 'season-1',
                                    horizonDays: 90,
                                    domains: ['risk'],
                                    degraded: false,
                                    riskTier: 'high',
                                    recommendedAction: 'Усилить risk-контур',
                                    scenarioName: null,
                                    createdByUserId: null,
                                    createdAt: '2026-03-12T12:00:00.000Z',
                                    evaluation: { status: 'pending' },
                                },
                            ],
                            total: 1,
                            limit,
                            offset,
                            hasMore: false,
                        },
                    };
                }

                if (query.seasonId === 'season-1' && offset === 0) {
                    return {
                        data: {
                            items: [
                                {
                                    id: 'run-1',
                                    traceId: 'di_1',
                                    scopeLevel: 'company',
                                    seasonId: 'season-1',
                                    horizonDays: 90,
                                    domains: ['finance'],
                                    degraded: false,
                                    riskTier: 'medium',
                                    recommendedAction: 'Базовая стратегия',
                                    scenarioName: null,
                                    createdByUserId: null,
                                    createdAt: '2026-03-12T10:00:00.000Z',
                                    evaluation: { status: 'pending' },
                                },
                            ],
                            total: 2,
                            limit,
                            offset,
                            hasMore: true,
                        },
                    };
                }

                if (query.seasonId === 'season-1' && offset === 1) {
                    return {
                        data: {
                            items: [
                                {
                                    id: 'run-2',
                                    traceId: 'di_2',
                                    scopeLevel: 'company',
                                    seasonId: 'season-1',
                                    horizonDays: 90,
                                    domains: ['economics'],
                                    degraded: false,
                                    riskTier: 'low',
                                    recommendedAction: 'Расширить программу роста',
                                    scenarioName: null,
                                    createdByUserId: null,
                                    createdAt: '2026-03-12T11:00:00.000Z',
                                    evaluation: { status: 'pending' },
                                },
                            ],
                            total: 2,
                            limit,
                            offset,
                            hasMore: false,
                        },
                    };
                }

                return {
                    data: {
                        items: [],
                        total: 0,
                        limit,
                        offset,
                        hasMore: false,
                    },
                };
            },
        );

        render(<StrategyForecastsPage />);

        expect(await screen.findByText('Базовая стратегия')).toBeInTheDocument();
        expect(screen.getByText(/Показано 1 из 2/i)).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Показать ещё' }));

        expect(await screen.findByText('Расширить программу роста')).toBeInTheDocument();
        expect(screen.getByText(/Показано 2 из 2/i)).toBeInTheDocument();
        expect(historyStrategyForecastMock).toHaveBeenCalledWith(
            expect.objectContaining({
                seasonId: 'season-1',
                offset: 1,
            }),
        );

        await user.selectOptions(screen.getByLabelText('Фильтр уровня риска в истории'), 'high');

        expect(await screen.findByText('Усилить risk-контур')).toBeInTheDocument();
        expect(historyStrategyForecastMock).toHaveBeenCalledWith(
            expect.objectContaining({
                seasonId: 'season-1',
                riskTier: 'high',
            }),
        );
    });
});
