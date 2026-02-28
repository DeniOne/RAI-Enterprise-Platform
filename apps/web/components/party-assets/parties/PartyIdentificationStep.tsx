'use client';

import { useEffect, useMemo, useState } from 'react';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyType } from '@/shared/types/party-assets';
import {
  IdentificationFieldKey,
  PartyIdentificationSchema,
  PartyLookupResult,
  PartyLookupStatus,
} from '@/shared/types/party-lookup';
import {
  assertIdentificationSchemaSafety,
  formatLookupBadgeDate,
  getIdentificationFieldValue,
  normalizeIdentificationValue,
} from '@/shared/lib/party-lookup';

export type PartyIdentificationFormValue = Partial<Record<IdentificationFieldKey, string>>;

export function PartyIdentificationStep({
  jurisdictionId,
  partyType,
  value,
  onChangeField,
  onSchemaLoaded,
  onLookup,
  onApply,
  onManual,
  lookupLoading,
  lookupError,
  lookupStatus,
  lookupResult,
  lookupSource,
  lookupFetchedAt,
  fieldErrors,
  lookupDisabledReason,
}: {
  jurisdictionId: string;
  partyType: PartyType;
  value: PartyIdentificationFormValue;
  onChangeField: (key: IdentificationFieldKey, value: string) => void;
  onSchemaLoaded: (schema: PartyIdentificationSchema | null) => void;
  onLookup: () => void;
  onApply: () => void;
  onManual: () => void;
  lookupLoading: boolean;
  lookupError?: string | null;
  lookupStatus?: PartyLookupStatus | null;
  lookupResult?: PartyLookupResult | null;
  lookupSource?: string | null;
  lookupFetchedAt?: string | null;
  fieldErrors?: Partial<Record<IdentificationFieldKey, string>>;
  lookupDisabledReason?: string | null;
}) {
  const [schema, setSchema] = useState<PartyIdentificationSchema | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!jurisdictionId) {
      setSchema(null);
      setSchemaError(null);
      onSchemaLoaded(null);
      return;
    }

    setSchemaLoading(true);
    setSchemaError(null);

    partyAssetsApi
      .getIdentificationSchema(jurisdictionId, partyType)
      .then((response) => {
        if (!active) {
          return;
        }
        assertIdentificationSchemaSafety(response);
        setSchema(response);
        onSchemaLoaded(response);
      })
      .catch((error) => {
        if (!active) {
          return;
        }
        const message =
          error instanceof Error
            ? error.message
            : 'Не удалось загрузить схему идентификации.';
        if (process.env.NODE_ENV === 'production') {
          if (typeof window !== 'undefined' && message.includes('Небезопасная schema идентификации')) {
            window.alert(message);
          }
          console.error(message);
          setSchemaError(message);
          setSchema(null);
          onSchemaLoaded(null);
          return;
        }
        throw error;
      })
      .finally(() => {
        if (active) {
          setSchemaLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [jurisdictionId, onSchemaLoaded, partyType]);

  const lookupEnabled = schema?.lookup.enabled ?? false;
  const lookupButtonLabel = schema?.lookup.buttonLabel ?? 'Найти по реквизитам';
  const hasFields = (schema?.fields.length ?? 0) > 0;

  const renderedFields = useMemo(() => schema?.fields ?? [], [schema?.fields]);

  if (schemaLoading) {
    return (
      <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm font-normal text-gray-700">
        Загрузка схемы идентификации...
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-normal text-red-700">
        {schemaError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!hasFields ? (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm font-normal text-gray-700">
          Для выбранного типа схема идентификации не содержит полей. Перейдите дальше вручную.
        </div>
      ) : null}

      {hasFields ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {renderedFields.map((field) => (
            <div key={field.key} className={renderedFields.length === 1 ? 'md:col-span-2' : ''}>
              <label htmlFor={`identification-${field.key}`} className="mb-2 block text-sm font-normal text-gray-700">
                {field.label}
                {field.required ? ' *' : ''}
              </label>
              <input
                id={`identification-${field.key}`}
                value={getIdentificationFieldValue(value, field.key)}
                onChange={(event) => onChangeField(field.key, normalizeIdentificationValue(event.target.value, field))}
                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                placeholder={field.label}
                inputMode={field.mask === 'digits' ? 'numeric' : 'text'}
              />
              {fieldErrors?.[field.key] ? <p className="mt-2 text-sm font-normal text-red-600">{fieldErrors[field.key]}</p> : null}
            </div>
          ))}
        </div>
      ) : null}

      {lookupDisabledReason ? <p className="text-sm font-normal text-gray-600">{lookupDisabledReason}</p> : null}

      <div className="flex flex-wrap gap-2">
        {lookupEnabled ? (
          <button
            type="button"
            onClick={onLookup}
            disabled={lookupLoading || Boolean(lookupDisabledReason)}
            className="rounded-2xl bg-black px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {lookupButtonLabel}
          </button>
        ) : null}
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

      {lookupResult ? (
        <LookupPreviewCard
          lookupResult={lookupResult}
          lookupSource={lookupSource}
          lookupFetchedAt={lookupFetchedAt}
          onApply={onApply}
        />
      ) : null}
    </div>
  );
}

function LookupPreviewCard({
  lookupResult,
  lookupSource,
  lookupFetchedAt,
  onApply,
}: {
  lookupResult: PartyLookupResult;
  lookupSource?: string | null;
  lookupFetchedAt?: string | null;
  onApply: () => void;
}) {
  const legalAddress = lookupResult.addresses?.find((item) => item.type === 'LEGAL')?.full ?? '—';

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4">
      <p className="text-sm font-medium text-gray-900">Предварительный результат</p>
      <div className="mt-3 space-y-1 text-sm font-normal text-gray-700">
        <p>
          Наименование: <span className="font-medium text-gray-900">{lookupResult.legalName || '—'}</span>
        </p>
        <p>Статус: {lookupResult.meta?.status || '—'}</p>
        <p>ОГРН: {lookupResult.requisites?.ogrn || '—'}</p>
        <p>ОГРНИП: {lookupResult.requisites?.ogrnip || '—'}</p>
        <p>Адрес: {legalAddress}</p>
        <p>Источник: {lookupSource || '—'}</p>
        <p>Дата получения: {lookupFetchedAt ? formatLookupBadgeDate(lookupFetchedAt) : '—'}</p>
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
