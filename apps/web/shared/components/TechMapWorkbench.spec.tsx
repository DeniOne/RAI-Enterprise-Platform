import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechMapWorkbench, Operation, ChangeOrderSummary } from '../../components/consulting/TechMapWorkbench';
import { AuthorityContextType } from '@/core/governance/AuthorityContext';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { TechMapStatus } from '@/lib/consulting/ui-policy';

const baseAuthority: AuthorityContextType = {
    canApprove: false,
    canEdit: true,
    canEscalate: false,
    canOverride: false,
    canSign: false,
};

const baseContext: DomainUiContext = {
    plansCount: 0,
    activeTechMap: true,
    lockedBudget: false,
    criticalDeviations: 0,
    advisoryRiskLevel: 'low',
};

function renderWorkbench(options?: {
    status?: TechMapStatus;
    operations?: Operation[];
    changeOrders?: ChangeOrderSummary[];
}) {
    const { status = 'PROJECT', operations = [], changeOrders } = options ?? {};

    return render(
        <TechMapWorkbench
            techMap={{
                id: 'TM-1',
                status,
                operations,
                changeOrders,
            }}
            authority={baseAuthority}
            context={baseContext}
        />,
    );
}

describe('TechMapWorkbench', () => {
    it('рендерится без ошибок при пустых operations', () => {
        renderWorkbench();
        expect(screen.getByText(/Workbench: TM-1/i)).toBeInTheDocument();
        expect(screen.getByText(/Режим проектирования активен/i)).toBeInTheDocument();
    });

    it('FROZEN режим блокирует все кнопки', () => {
        renderWorkbench({ status: 'FROZEN' });
        const buttons = screen.getAllByRole('button');
        buttons.forEach((btn) => {
            expect(btn).toBeDisabled();
        });
    });

    it('критическая операция подсвечивается классом критического пути', async () => {
        const operations: Operation[] = [
            {
                id: 'op-1',
                title: 'Критическая операция',
                status: 'PENDING',
                isCritical: true,
            },
        ];

        renderWorkbench({ operations });

        const user = userEvent.setup();
        await user.click(screen.getByRole('button', { name: /График/i }));

        const criticalText = screen.getByText(/Критическая операция/i);
        const criticalCard = criticalText.closest('div')?.parentElement?.parentElement as HTMLElement | null;
        expect(criticalCard).toHaveClass('border-red-500');
    });

    it('панель ChangeOrder не рендерится в режиме FROZEN', async () => {
        const user = userEvent.setup();
        renderWorkbench({ status: 'FROZEN' });

        const toggle = screen.getByRole('button', { name: /Запросы на изменение техкарты/i });
        expect(toggle).toBeDisabled();

        await user.click(toggle);
        expect(screen.queryByText(/Создать запрос на изменение/i)).not.toBeInTheDocument();
    });
});

