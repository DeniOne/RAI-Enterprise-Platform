'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

type AccountItem = {
  id: string;
  name?: string | null;
  inn?: string | null;
};

const SOIL_TYPES = ['CHERNOZEM', 'LOAM', 'SANDY', 'CLAY', 'PODZOLIC', 'SODDY', 'GRAY_FOREST', 'CHESTNUT'];

function buildDraftPolygon() {
  return {
    type: 'Polygon',
    coordinates: [[
      [37.6, 55.7],
      [37.62, 55.7],
      [37.62, 55.72],
      [37.6, 55.72],
      [37.6, 55.7],
    ]],
  };
}

export function FieldCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [companyId, setCompanyId] = useState('');
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountSearch, setAccountSearch] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [name, setName] = useState('');
  const [cadastreNumber, setCadastreNumber] = useState(`FIELD-${Date.now()}`);
  const [area, setArea] = useState('120');
  const [soilType, setSoilType] = useState('CHERNOZEM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const me = await api.users.me();
        const nextCompanyId = me?.data?.companyId || '';
        if (!active) {
          return;
        }
        setCompanyId(nextCompanyId);

        const accountsResponse = nextCompanyId ? await api.crm.accounts(nextCompanyId) : { data: [] };
        const items = Array.isArray(accountsResponse.data) ? accountsResponse.data : [];
        if (!active) {
          return;
        }
        setAccounts(items);
        setSelectedAccountId(items[0]?.id || '');
      } catch {
        if (active) {
          setAccounts([]);
          setSelectedAccountId('');
        }
      } finally {
        if (active) {
          setLoadingAccounts(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    if (!query) {
      return accounts;
    }

    return accounts.filter((account) =>
      [account.name, account.inn]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [accountSearch, accounts]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account.id === selectedAccountId) || null,
    [accounts, selectedAccountId],
  );

  const canNext = step === 1
    ? selectedAccountId.trim().length > 0
    : step === 2
      ? name.trim().length > 0 && cadastreNumber.trim().length > 0 && Number(area) > 0
      : true;

  const submit = async () => {
    if (!companyId || !selectedAccountId.trim()) {
      setError('Для создания поля требуется выбранное хозяйство из реестра Accounts.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const response = await api.crm.createField({
        cadastreNumber: cadastreNumber.trim(),
        name: name.trim() || undefined,
        area: Number(area),
        coordinates: buildDraftPolygon(),
        soilType,
        accountId: selectedAccountId,
        companyId,
      });

      const fieldId = response?.data?.id;
      const searchParams = new URLSearchParams({
        accountId: selectedAccountId,
        ...(fieldId ? { fieldId } : {}),
      });

      router.push(`/consulting/techmaps/new?${searchParams.toString()}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Не удалось создать поле.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6">
      <div className="flex gap-2 text-sm font-medium text-gray-500">
        <span className={step >= 1 ? 'text-gray-900' : ''}>Выбор хозяйства</span>
        <span>/</span>
        <span className={step >= 2 ? 'text-gray-900' : ''}>Паспорт поля</span>
        <span>/</span>
        <span className={step >= 3 ? 'text-gray-900' : ''}>Подтверждение</span>
      </div>

      {step === 1 ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
            Поле сейчас создаётся в `Field Registry` и требует выбор хозяйства из account-контура. Это реальный текущий backend-путь, от которого уже зависят `Season` и генерация `TechMap`.
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Поиск хозяйства</label>
            <input
              value={accountSearch}
              onChange={(event) => setAccountSearch(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Поиск по названию или ИНН"
            />
          </div>
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-2xl border border-black/10 bg-white p-3">
            {loadingAccounts ? (
              <p className="text-sm font-normal text-gray-500">Загрузка хозяйств...</p>
            ) : filteredAccounts.length === 0 ? (
              <p className="text-sm font-normal text-gray-500">В account-контуре пока нет хозяйств. Следующий шаг для продукта: свести Party/Farm и Account в единый контур.</p>
            ) : (
              filteredAccounts.map((account) => {
                const isSelected = account.id === selectedAccountId;
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setSelectedAccountId(account.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      isSelected ? 'border-black/30 bg-gray-50' : 'border-black/10 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{account.name || account.id}</div>
                    <div className="mt-1 text-xs text-gray-500">ИНН {account.inn || '—'}</div>
                    <div className="mt-1 text-xs text-gray-400">{account.id}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Название поля</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Поле Южное"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Кадастровый номер</label>
            <input
              value={cadastreNumber}
              onChange={(event) => setCadastreNumber(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="62:25:0000000:001"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Площадь, га</label>
            <input
              value={area}
              onChange={(event) => setArea(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="120"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Тип почвы</label>
            <select
              value={soilType}
              onChange={(event) => setSoilType(event.target.value)}
              className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            >
              {SOIL_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3 rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-700">
          <div>
            <span className="text-gray-500">Хозяйство: </span>
            <span className="font-medium">{selectedAccount?.name || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Поле: </span>
            <span className="font-medium">{name || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Кадастр: </span>
            <span className="font-medium">{cadastreNumber || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Площадь: </span>
            <span className="font-medium">{area || '—'} га</span>
          </div>
          <p className="text-sm text-gray-600">
            После подтверждения мастер сразу переведёт в подготовку техкарты на шаг сезона.
            Эффект: пользователь не теряет поле и продолжает реальный поток без ручного поиска следующего экрана.
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
            onClick={() => {
              setError(null);
              setStep((prev) => Math.min(3, prev + 1));
            }}
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
            disabled={saving || !canNext}
          >
            {saving ? 'Создание...' : 'Создать поле'}
          </button>
        )}
      </div>
    </div>
  );
}
