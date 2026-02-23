'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { SystemStatusBar } from '@/components/consulting/SystemStatusBar';
import { DomainUiContext } from '@/lib/consulting/navigation-policy';
import { AIRecommendationBlock, AIExplainabilityDto } from '@/shared/components/AIRecommendationBlock';
import { includesFocus, useEntityFocus } from '@/shared/hooks/useEntityFocus';
import clsx from 'clsx';
import { useAuthority } from '@/core/governance/AuthorityContext';

type DecisionItem = {
    id: string;
    deviationId: string;
    title: string;
    author: string;
    date: string;
    outcome: 'APPROVED' | 'REJECTED';
    impact: string;
};

const MOCK_EXPLAINABILITY: Record<string, AIExplainabilityDto> = {
    'DEC-101': {
        confidence: 0.94,
        verdict: 'HIGHLY_PROBABLE',
        factors: [
            { name: 'Экономическая эффективность', weight: 0.6, impact: 0.85, description: 'Снижение стоимости логистики при оптовой закупке' },
            { name: 'Риск дефицита', weight: 0.3, impact: 0.4, description: 'Прогноз нехватки топлива в регионе через 2 недели' },
            { name: 'Бюджетный лимит', weight: 0.1, impact: -0.1, description: 'Незначительное превышение квартального лимита' },
        ],
        counterfactuals: [
            {
                scenarioName: 'Отказ от закупки сейчас',
                deltaInput: { timing: 'postponed' },
                expectedOutcome: 'Увеличение затрат на 15%',
                probabilityShift: -0.22,
            },
        ],
        forensic: {
            modelVersion: 'strat-gpt-4o-v2',
            inferenceTimestamp: '2026-05-12T10:10:00.000Z',
            inputCanonicalHash: '8f43a9b93abf14fc11ab12cd67a1e8b31b6de4f8e2ca2e6ef4d1cace2c3d4e5f',
            explainabilityCanonicalHash: '1a5be6b93abf14fc11ab12cd67a1e8b31b6de4f8e2ca2e6ef4d1cace2d9fa10',
            ledgerTraceId: 'TRC-9901-X',
            environment: 'prod',
        },
        limitationsDisclosed: true,
    },
};

const MOCK_DECISIONS: DecisionItem[] = [
    { id: 'DEC-101', deviationId: 'DEV-001', title: 'Увеличение нормы ГСМ', author: 'AI_AGENT', date: '2026-05-12', outcome: 'APPROVED', impact: 'Economy: -1.2%' },
    { id: 'DEC-102', deviationId: 'DEV-004', title: 'Продажа остатков СЗР', author: 'MANAGER', date: '2026-05-10', outcome: 'REJECTED', impact: 'None' },
];

export default function DecisionsPage() {
    const [decisions] = useState(MOCK_DECISIONS);
    const authority = useAuthority();

    const domainContext = useMemo<DomainUiContext>(() => ({
        plansCount: 2,
        activeTechMap: true,
        lockedBudget: true,
        criticalDeviations: 0,
        advisoryRiskLevel: 'low',
    }), []);

    const { focusEntity, hasFocus, hasFocusedEntity, isFocused } = useEntityFocus({
        items: decisions,
        matchItem: (decision, context) => includesFocus([decision.id, decision.deviationId, decision.title], context.focusEntity),
    });

    return (
        <div className='p-8 max-w-7xl mx-auto font-geist'>
            <div className='mb-8'>
                <h1 className='text-2xl font-medium text-gray-900 tracking-tight mb-2'>Журнал Решений</h1>
                <p className='text-sm text-gray-500 font-normal'>Архив управленческих решений и их влияние на экономику урожая</p>
            </div>

            {hasFocus && (
                <div className={clsx('mb-4 rounded-xl border px-4 py-3 text-sm', hasFocusedEntity ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-amber-200 bg-amber-50 text-amber-700')}>
                    {hasFocusedEntity ? `Найдена сущность: ${focusEntity}. Запись подсвечена.` : `Сущность ${focusEntity} не найдена в журнале решений.`}
                </div>
            )}

            <SystemStatusBar context={domainContext} />

            <div className='bg-white border border-black/5 rounded-3xl overflow-hidden shadow-sm mt-8'>
                <div className='p-8 border-b border-black/5 flex justify-between items-center'>
                    <h2 className='text-lg font-medium text-gray-900'>Операционный лог</h2>
                    <button className='px-4 py-2 bg-gray-50 text-gray-600 rounded-xl text-xs font-medium border border-black/5 hover:bg-white transition-all'>Экспорт (PDF)</button>
                </div>

                <div className='p-2'>
                    <table className='w-full text-left border-separate border-spacing-y-2'>
                        <thead>
                            <tr className='text-[10px] text-gray-400 uppercase tracking-widest font-medium'>
                                <th className='px-6 py-3'>ID / Дата</th>
                                <th className='px-6 py-3'>Суть решения</th>
                                <th className='px-6 py-3'>Связанное отклонение</th>
                                <th className='px-6 py-3'>Результат</th>
                                <th className='px-6 py-3'>Эффект</th>
                            </tr>
                        </thead>
                        <tbody>
                            {decisions.map((dec) => {
                                const focused = isFocused(dec);
                                return (
                                    <tr key={dec.id} data-focus={focused ? 'true' : 'false'} className={clsx('group hover:bg-gray-50/50 transition-colors', focused && 'bg-sky-50 ring-1 ring-sky-200')}>
                                        <td className='px-6 py-4 align-top'>
                                            <div className='flex flex-col'>
                                                <span className='text-xs font-medium text-gray-900'>{dec.id}</span>
                                                <span className='text-[10px] text-gray-400'>{dec.date}</span>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 align-top'>
                                            <span className='text-sm text-gray-700 font-normal'>{dec.title}</span>
                                            <div className='text-[10px] text-gray-400 uppercase mt-1 mb-3'>Автор: {dec.author}</div>
                                            {dec.author === 'AI_AGENT' && (
                                                <AIRecommendationBlock
                                                    explainability={MOCK_EXPLAINABILITY[dec.id]}
                                                    traceId={MOCK_EXPLAINABILITY[dec.id]?.forensic?.ledgerTraceId}
                                                    traceStatus={MOCK_EXPLAINABILITY[dec.id]?.forensic?.ledgerTraceId ? 'AVAILABLE' : 'PENDING'}
                                                    authority={authority}
                                                    className='text-left'
                                                />
                                            )}
                                        </td>
                                        <td className='px-6 py-4 align-top'>
                                            <span className='text-xs text-blue-600 font-medium underline underline-offset-2 cursor-pointer'>{dec.deviationId}</span>
                                        </td>
                                        <td className='px-6 py-4 align-top'>
                                            <div className={clsx('px-3 py-1 rounded-full text-[10px] font-medium w-fit border', dec.outcome === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100')}>
                                                {dec.outcome}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 align-top'><span className='text-xs font-medium text-gray-900'>{dec.impact}</span></td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
