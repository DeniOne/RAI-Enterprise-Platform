'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { canActivateFarm } from '@/shared/lib/party-assets-invariants';
import { AssetPartyRoleDto, PartyListItemVm } from '@/shared/types/party-assets';

export function FarmCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [operatorPartyId, setOperatorPartyId] = useState('');
  const [partySearch, setPartySearch] = useState('');
  const [parties, setParties] = useState<PartyListItemVm[]>([]);
  const [loadingParties, setLoadingParties] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    partyAssetsApi
      .listParties()
      .then((items) => {
        if (active) {
          setParties(items);
        }
      })
      .catch(() => {
        if (active) {
          setParties([]);
        }
      })
      .finally(() => {
        if (active) {
          setLoadingParties(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const draftOperatorRole: AssetPartyRoleDto[] = useMemo(
    () =>
      operatorPartyId
        ? [
            {
              id: 'draft-operator',
              assetId: 'draft',
              partyId: operatorPartyId,
              role: 'OPERATOR',
              validFrom: new Date().toISOString().slice(0, 10),
            },
          ]
        : [],
    [operatorPartyId],
  );

  const activationCheck = useMemo(
    () => canActivateFarm(draftOperatorRole, new Date().toISOString().slice(0, 10)),
    [draftOperatorRole],
  );
  const filteredParties = useMemo(() => {
    const query = partySearch.trim().toLowerCase();
    if (!query) {
      return parties;
    }

    return parties.filter((party) =>
      [
        party.legalName,
        party.shortName,
        party.registrationData?.inn,
        party.registrationData?.requisites?.inn,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [parties, partySearch]);
  const selectedOperator = useMemo(
    () => parties.find((party) => party.id === operatorPartyId) || null,
    [operatorPartyId, parties],
  );

  const submit = async () => {
    if (!activationCheck.ok) {
      setError(activationCheck.reason || 'Отсутствует активный оператор.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const farm = await partyAssetsApi.createFarm({
        name: name.trim(),
        regionCode: regionCode.trim() || undefined,
        status: 'ACTIVE',
      });

      await partyAssetsApi.assignAssetRole({
        assetId: farm.id,
        partyId: operatorPartyId,
        role: 'OPERATOR',
        validFrom: new Date().toISOString().slice(0, 10),
      });

      router.push(`/assets/farms/${encodeURIComponent(farm.id)}`);
    } catch {
      setError('Не удалось создать хозяйство.');
    } finally {
      setSaving(false);
    }
  };

  const canNext = step === 1 ? name.trim().length > 0 : operatorPartyId.trim().length > 0;

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6">
      <div className="flex gap-2 text-sm font-medium text-gray-500">
        <span className={step >= 1 ? 'text-gray-900' : ''}>Профиль хозяйства</span>
        <span>/</span>
        <span className={step >= 2 ? 'text-gray-900' : ''}>Назначение ролей</span>
        <span>/</span>
        <span className={step >= 3 ? 'text-gray-900' : ''}>Готово</span>
      </div>

      {step === 1 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Наименование хозяйства</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Хозяйство Юг"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Код региона</label>
            <input
              value={regionCode}
              onChange={(event) => setRegionCode(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="RU-ROS"
            />
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Контрагент-оператор (обязательно)</label>
            <input
              value={partySearch}
              onChange={(event) => setPartySearch(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Поиск по названию или ИНН"
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-black/10 bg-white p-3">
            {loadingParties ? (
              <p className="text-sm font-normal text-gray-500">Загрузка контрагентов...</p>
            ) : filteredParties.length === 0 ? (
              <p className="text-sm font-normal text-gray-500">Контрагенты не найдены. Сначала создай контрагента в CRM.</p>
            ) : (
              filteredParties.map((party) => {
                const isSelected = party.id === operatorPartyId;
                const inn = party.registrationData?.inn || party.registrationData?.requisites?.inn || '—';

                return (
                  <button
                    key={party.id}
                    type="button"
                    onClick={() => setOperatorPartyId(party.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isSelected ? 'border-black/30 bg-gray-50' : 'border-black/10 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{party.shortName || party.legalName}</div>
                    <div className="mt-1 text-xs text-gray-500">{party.legalName}</div>
                    <div className="mt-2 text-xs text-gray-600">
                      {party.type} • ИНН {inn}
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <p className={`text-sm ${activationCheck.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
            {activationCheck.ok ? 'Инвариант роли оператора соблюден.' : activationCheck.reason}
          </p>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-700">
          <div>
            <span className="text-gray-500">Хозяйство: </span>
            <span className="font-medium">{name || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Регион: </span>
            <span className="font-medium">{regionCode || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Оператор: </span>
            <span className="font-medium">{selectedOperator?.shortName || selectedOperator?.legalName || '—'}</span>
          </div>
          <p className="text-sm text-gray-600">
            После создания хозяйства следующий рабочий шаг: создать поле в реестре и привязать его к хозяйственному контуру планирования.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50"
          disabled={step === 1}
        >
          Назад
        </button>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(3, prev + 1))}
            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            disabled={!canNext}
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            disabled={saving || !activationCheck.ok}
          >
            {saving ? 'Создание...' : 'Создать хозяйство'}
          </button>
        )}
      </div>
    </div>
  );
}
