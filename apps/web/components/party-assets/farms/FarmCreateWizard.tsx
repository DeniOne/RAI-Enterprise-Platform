'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { canActivateFarm } from '@/shared/lib/party-assets-invariants';
import { AssetPartyRoleDto } from '@/shared/types/party-assets';

export function FarmCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [regionCode, setRegionCode] = useState('');
  const [operatorPartyId, setOperatorPartyId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          <label className="mb-2 block text-sm font-normal text-gray-700">ID контрагента-оператора (обязательно)</label>
          <input
            value={operatorPartyId}
            onChange={(event) => setOperatorPartyId(event.target.value)}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            placeholder="id-контрагента"
          />
          <p className={`text-sm ${activationCheck.ok ? 'text-emerald-700' : 'text-amber-700'}`}>
            {activationCheck.ok ? 'Инвариант роли оператора соблюден.' : activationCheck.reason}
          </p>
        </div>
      ) : null}

      {step === 3 ? <p className="text-sm text-gray-700">Проверка завершена, можно создать хозяйство.</p> : null}

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
