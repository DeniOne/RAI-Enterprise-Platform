'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui';
import { api } from '@/lib/api';

type ContractRole = {
    id: string;
    role: string;
    isPrimary: boolean;
    party: {
        id: string;
        legalName: string;
    };
};

type CommerceContract = {
    id: string;
    number: string;
    type: string;
    status: string;
    validFrom: string;
    validTo: string | null;
    createdAt: string;
    roles: ContractRole[];
};

export default function CommerceContractsPage() {
    const searchParams = useSearchParams();
    const focusedEntity = searchParams.get('entity');
    const severity = searchParams.get('severity');

    const [contracts, setContracts] = useState<CommerceContract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(null);

        api.commerce.contracts()
            .then((response) => {
                if (!active) return;
                setContracts(response.data ?? []);
            })
            .catch(() => {
                if (!active) return;
                setError('Не удалось загрузить договоры. Повтори запрос.');
            })
            .finally(() => {
                if (!active) return;
                setLoading(false);
            });

        return () => {
            active = false;
        };
    }, []);

    const normalizedFocus = focusedEntity?.trim().toLowerCase() ?? null;
    const focusedContractId = useMemo(() => {
        if (!normalizedFocus) return null;
        const match = contracts.find((item) =>
            item.id.toLowerCase() === normalizedFocus || item.number.toLowerCase() === normalizedFocus
        );
        return match?.id ?? null;
    }, [contracts, normalizedFocus]);

    const resolveSeverity = (status: string): 'ok' | 'warning' | 'critical' => {
        if (status === 'VOID') return 'critical';
        if (status === 'DRAFT' || status === 'PARTIALLY_PAID') return 'warning';
        return 'ok';
    };

    const filteredContracts = useMemo(() => {
        if (!severity || !['ok', 'warning', 'critical'].includes(severity)) {
            return contracts;
        }
        return contracts.filter((item) => resolveSeverity(item.status) === severity);
    }, [contracts, severity]);

    useEffect(() => {
        if (!focusedContractId) return;
        const element = document.querySelector(`[data-contract-id="${focusedContractId}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [focusedContractId]);

    return (
        <div className="space-y-6" data-testid="commerce-contracts-page">
            <h1 className="text-xl font-medium text-gray-900">Коммерция: Договоры</h1>
            <Card className="rounded-3xl border-black/10">
                {loading ? (
                    <p className="text-sm font-normal text-gray-500">Загрузка договоров...</p>
                ) : null}

                {!loading && error ? (
                    <div className="space-y-3">
                        <p className="text-sm font-normal text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="rounded-xl border border-black/10 px-3 py-2 text-sm font-medium text-gray-800"
                        >
                            Повторить
                        </button>
                    </div>
                ) : null}

                {!loading && !error && filteredContracts.length === 0 ? (
                    <p className="text-sm font-normal text-gray-500">Договоры пока не созданы.</p>
                ) : null}

                {!loading && !error && filteredContracts.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm text-gray-700">
                            <thead>
                                <tr className="border-b border-black/10 text-left">
                                    <th className="px-3 py-2 font-medium text-gray-900">Номер</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Тип</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Статус</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Период</th>
                                    <th className="px-3 py-2 font-medium text-gray-900">Роли</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContracts.map((contract) => {
                                    const isFocused = focusedContractId === contract.id;
                                    return (
                                        <tr
                                            key={contract.id}
                                            data-testid={`contract-row-${contract.id}`}
                                            data-contract-id={contract.id}
                                            data-focus={isFocused ? 'true' : 'false'}
                                            className={isFocused ? 'border-b border-black/5 bg-amber-50' : 'border-b border-black/5'}
                                        >
                                            <td className="px-3 py-2 font-normal text-gray-800">{contract.number}</td>
                                            <td className="px-3 py-2 font-normal">{contract.type}</td>
                                            <td className="px-3 py-2 font-normal">{contract.status}</td>
                                            <td className="px-3 py-2 font-normal">
                                                {new Date(contract.validFrom).toLocaleDateString('ru-RU')} -{' '}
                                                {contract.validTo ? new Date(contract.validTo).toLocaleDateString('ru-RU') : 'без даты'}
                                            </td>
                                            <td className="px-3 py-2 font-normal">
                                                {contract.roles.map((role) => `${role.role}: ${role.party.legalName}`).join('; ')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </Card>
        </div>
    );
}
