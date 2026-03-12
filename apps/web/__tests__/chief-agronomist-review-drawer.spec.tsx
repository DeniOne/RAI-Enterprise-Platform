import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChiefAgronomistReviewDrawer } from '@/components/experts/ChiefAgronomistReviewDrawer';

const chiefAgronomistReviewMock = jest.fn();
const applyReviewOutcomeMock = jest.fn();
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: pushMock,
    }),
}));

jest.mock('@/components/strategic/DetailOverlay', () => ({
    DetailOverlay: ({
        isOpen,
        children,
    }: {
        isOpen: boolean;
        onClose: () => void;
        title: string;
        subtitle?: string;
        children: React.ReactNode;
    }) => (isOpen ? <div>{children}</div> : null),
}));

jest.mock('@/lib/feature-flags', () => ({
    webFeatureFlags: {
        chiefAgronomistPanel: true,
    },
}));

jest.mock('@/lib/api', () => ({
    api: {
        experts: {
            chiefAgronomistReview: (...args: unknown[]) => chiefAgronomistReviewMock(...args),
            applyReviewOutcome: (...args: unknown[]) => applyReviewOutcomeMock(...args),
        },
    },
}));

describe('ChiefAgronomistReviewDrawer', () => {
    beforeEach(() => {
        chiefAgronomistReviewMock.mockReset();
        applyReviewOutcomeMock.mockReset();
        pushMock.mockReset();
    });

    it('opens drawer and renders contextual review payload', async () => {
        const user = userEvent.setup();
        chiefAgronomistReviewMock.mockResolvedValue({
            data: {
                reviewId: 'rev-1',
                traceId: 'trace-1',
                verdict: 'Снизить риск и выполнить корректировку в течение 24 часов.',
                actionsNow: ['Проверить окно обработки', 'Подтвердить состояние поля'],
                alternatives: ['Отложить вмешательство до утреннего осмотра'],
                basedOn: ['Похожий кейс прошлого сезона', 'Активный сигнал по полю'],
                evidence: [
                    {
                        claim: 'Есть повторяющийся паттерн отклонения',
                        sourceType: 'DB',
                        sourceId: 'field-1',
                        confidenceScore: 0.91,
                    },
                ],
                riskTier: 'medium',
                requiresHumanDecision: true,
                status: 'completed',
            },
        });

        render(
            <ChiefAgronomistReviewDrawer
                title="Техкарта TM-001"
                request={{
                    entityType: 'techmap',
                    entityId: 'tm-1',
                    reason: 'Контекстная экспертная проверка техкарты TM-001',
                    fieldId: 'field-1',
                    seasonId: 'season-1',
                    workspaceRoute: '/consulting/techmaps/active',
                }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Запросить экспертное заключение/i }));

        await waitFor(() => {
            expect(chiefAgronomistReviewMock).toHaveBeenCalledWith(
                expect.objectContaining({
                    entityType: 'techmap',
                    entityId: 'tm-1',
                    fieldId: 'field-1',
                    seasonId: 'season-1',
                }),
            );
        });

        expect(await screen.findByText(/Снизить риск и выполнить корректировку/i)).toBeInTheDocument();
        expect(screen.getByText('Что делать сейчас')).toBeInTheDocument();
        expect(screen.getByText(/Проверить окно обработки/i)).toBeInTheDocument();
    });

    it('applies hand-off outcome for contextual review', async () => {
        const user = userEvent.setup();
        chiefAgronomistReviewMock.mockResolvedValue({
            data: {
                reviewId: 'rev-2',
                traceId: 'trace-2',
                verdict: 'Требуется ручная проверка агронома.',
                actionsNow: ['Открыть задачу на осмотр'],
                alternatives: [],
                basedOn: ['Недостаточно полного полевого контекста'],
                evidence: [],
                riskTier: 'high',
                requiresHumanDecision: true,
                status: 'needs_more_context',
                missingContext: ['seasonId'],
            },
        });
        applyReviewOutcomeMock.mockResolvedValue({
            data: {
                reviewId: 'rev-2',
                traceId: 'trace-2',
                verdict: 'Требуется ручная проверка агронома.',
                actionsNow: ['Открыть задачу на осмотр'],
                alternatives: [],
                basedOn: ['Недостаточно полного полевого контекста'],
                evidence: [],
                riskTier: 'high',
                requiresHumanDecision: true,
                status: 'needs_more_context',
                missingContext: ['seasonId'],
                outcomeAction: 'hand_off',
                resolvedAt: '2026-03-12T09:00:00.000Z',
            },
        });
        const promptSpy = jest.spyOn(window, 'prompt').mockReturnValue('');

        render(
            <ChiefAgronomistReviewDrawer
                title="Отклонение DEV-1"
                request={{
                    entityType: 'deviation',
                    entityId: 'dev-1',
                    reason: 'Экспертная проверка отклонения',
                    workspaceRoute: '/consulting/deviations/decisions',
                }}
            />,
        );

        await user.click(screen.getByRole('button', { name: /Запросить экспертное заключение/i }));
        await screen.findByText(/Требуется ручная проверка агронома/i);

        await user.click(screen.getByRole('button', { name: /Передать человеку/i }));

        await waitFor(() => {
            expect(applyReviewOutcomeMock).toHaveBeenCalledWith('rev-2', { action: 'hand_off' });
        });

        expect(await screen.findByText(/Outcome/i)).toBeInTheDocument();
        promptSpy.mockRestore();
    });
});
