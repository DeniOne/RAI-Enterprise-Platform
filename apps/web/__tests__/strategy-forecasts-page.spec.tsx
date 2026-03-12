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
        historyStrategyForecastMock.mockResolvedValue({ data: [] });
        listStrategyScenariosMock.mockResolvedValue({ data: [] });
        deleteStrategyScenarioMock.mockResolvedValue({ data: { ok: true } });
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
        await user.type(screen.getByLabelText('OPEX, %'), '-4');

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
        expect(screen.getByText(/saved/)).toBeInTheDocument();

        await user.clear(screen.getByLabelText('Название сценария'));
        await user.type(screen.getByLabelText('Название сценария'), 'Черновик');
        await user.clear(screen.getByLabelText('Цена реализации, %'));
        await user.clear(screen.getByLabelText('OPEX, %'));

        const loadButtons = screen.getAllByRole('button', { name: /Загрузить/i });
        await user.click(loadButtons[0]);

        expect(screen.getByLabelText('Название сценария')).toHaveValue('Сценарий роста');
        expect(screen.getByLabelText('Цена реализации, %')).toHaveValue(12);
        expect(screen.getByLabelText('OPEX, %')).toHaveValue(-4);
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
            data: [
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
});
