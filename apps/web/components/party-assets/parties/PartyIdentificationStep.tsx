'use client';

import { PartyType } from '@/shared/types/party-assets';
import { PartyLookupResult, PartyLookupStatus } from '@/shared/types/party-lookup';

export interface PartyIdentificationFormValue {
  inn: string;
  kpp: string;
  unp: string;
  bin: string;
}

export function PartyIdentificationStep({
  partyType,
  jurisdictionCode,
  value,
  onChange,
  onLookup,
  onApply,
  onManual,
  lookupLoading,
  lookupError,
  lookupStatus,
  lookupResult,
  innValidationError,
  lookupDisabledReason,
}: {
  partyType: PartyType;
  jurisdictionCode: string | null;
  value: PartyIdentificationFormValue;
  onChange: (patch: Partial<PartyIdentificationFormValue>) => void;
  onLookup: () => void;
  onApply: () => void;
  onManual: () => void;
  lookupLoading: boolean;
  lookupError?: string | null;
  lookupStatus?: PartyLookupStatus | null;
  lookupResult?: PartyLookupResult | null;
  innValidationError?: string | null;
  lookupDisabledReason?: string | null;
}) {
  const normalizedJurisdiction = jurisdictionCode?.toUpperCase() ?? null;
  const showRuForLegalEntity = normalizedJurisdiction === 'RU' && partyType === 'LEGAL_ENTITY';
  const showRuForEntrepreneur = normalizedJurisdiction === 'RU' && (partyType === 'IP' || partyType === 'KFH');
  const showBy = normalizedJurisdiction === 'BY';
  const showKz = normalizedJurisdiction === 'KZ';
  const supportedType = partyType === 'LEGAL_ENTITY' || partyType === 'IP' || partyType === 'KFH';
  const lookupUnavailable = !normalizedJurisdiction || !supportedType;

  return (
    <div className="space-y-4">
      {lookupUnavailable ? (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm font-normal text-gray-700">
          Автопоиск по реквизитам доступен только для типов «Юридическое лицо», «ИП» и «КФХ».
        </div>
      ) : null}

      {showRuForLegalEntity ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">ИНН (10 цифр) *</label>
            <input
              value={value.inn}
              onChange={(event) => onChange({ inn: event.target.value.replace(/\D+/g, '').slice(0, 10) })}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="7707083893"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">КПП (9 цифр)</label>
            <input
              value={value.kpp}
              onChange={(event) => onChange({ kpp: event.target.value.replace(/\D+/g, '').slice(0, 9) })}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="770701001"
              inputMode="numeric"
            />
          </div>
        </div>
      ) : null}

      {showRuForEntrepreneur ? (
        <div>
          <label className="mb-2 block text-sm font-normal text-gray-700">ИНН (12 цифр) *</label>
          <input
            value={value.inn}
            onChange={(event) => onChange({ inn: event.target.value.replace(/\D+/g, '').slice(0, 12) })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            placeholder="500100732259"
            inputMode="numeric"
          />
        </div>
      ) : null}

      {showBy ? (
        <div>
          <label className="mb-2 block text-sm font-normal text-gray-700">УНП *</label>
          <input
            value={value.unp}
            onChange={(event) => onChange({ unp: event.target.value.trim().slice(0, 15) })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            placeholder="100582333"
          />
        </div>
      ) : null}

      {showKz ? (
        <div>
          <label className="mb-2 block text-sm font-normal text-gray-700">БИН (12 цифр) *</label>
          <input
            value={value.bin}
            onChange={(event) => onChange({ bin: event.target.value.replace(/\D+/g, '').slice(0, 12) })}
            className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            placeholder="220140012345"
            inputMode="numeric"
          />
        </div>
      ) : null}

      {innValidationError ? <p className="text-sm font-normal text-red-600">{innValidationError}</p> : null}
      {lookupDisabledReason ? <p className="text-sm font-normal text-gray-600">{lookupDisabledReason}</p> : null}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onLookup}
          disabled={lookupLoading || Boolean(lookupDisabledReason)}
          className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          Найти по реквизитам
        </button>
        <button
          type="button"
          onClick={onManual}
          disabled={lookupLoading}
          className="rounded-2xl border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Заполнить вручную
        </button>
      </div>

      {lookupLoading ? (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm font-normal text-gray-700">
          Идёт поиск по реквизитам...
        </div>
      ) : null}

      {lookupError ? <p className="text-sm font-normal text-red-600">{lookupError}</p> : null}
      {lookupStatus === 'NOT_FOUND' ? <p className="text-sm font-normal text-gray-700">По реквизитам ничего не найдено.</p> : null}
      {lookupStatus === 'NOT_SUPPORTED' ? (
        <p className="text-sm font-normal text-gray-700">Для выбранной юрисдикции провайдер пока не поддерживается.</p>
      ) : null}

      {lookupResult ? <LookupPreviewCard lookupResult={lookupResult} onApply={onApply} /> : null}
    </div>
  );
}

function LookupPreviewCard({
  lookupResult,
  onApply,
}: {
  lookupResult: PartyLookupResult;
  onApply: () => void;
}) {
  const legalAddress = lookupResult.addresses?.find((item) => item.type === 'LEGAL')?.full;

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">Предварительный результат</p>
      <div className="mt-3 space-y-1 text-sm font-normal text-gray-700">
        <p>
          Наименование: <span className="font-medium text-gray-900">{lookupResult.legalName || '—'}</span>
        </p>
        <p>Краткое наименование: {lookupResult.shortName || '—'}</p>
        <p>ИНН: {lookupResult.requisites?.inn || '—'}</p>
        <p>КПП: {lookupResult.requisites?.kpp || '—'}</p>
        <p>ОГРН: {lookupResult.requisites?.ogrn || '—'}</p>
        <p>Адрес: {legalAddress || '—'}</p>
      </div>
      <button
        type="button"
        onClick={onApply}
        className="mt-4 rounded-2xl border border-black/10 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50"
      >
        Применить данные
      </button>
    </div>
  );
}
