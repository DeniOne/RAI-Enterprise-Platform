'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyBankRecord, PartyContactRecord, PartyType } from '@/shared/types/party-assets';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';
import { api } from '@/lib/api';
import { PartyIdentificationFormValue, PartyIdentificationStep } from './PartyIdentificationStep';
import { formatLookupBadgeDate, isRuInnValid } from '@/shared/lib/party-lookup';
import { getPartyRequisiteFields } from '@/shared/lib/party-requisites-schema';
import {
  IdentificationFieldKey,
  PartyIdentificationSchema,
  PartyDataProvenance,
  PartyLookupIdentifiers,
  PartyLookupRequest,
  PartyLookupResponse,
  PartyLookupStatus,
} from '@/shared/types/party-lookup';

const PARTY_TYPES: PartyType[] = ['HOLDING', 'LEGAL_ENTITY', 'IP', 'KFH', 'MANAGEMENT_CO', 'BANK', 'INSURER'];
type Jurisdiction = { id: string; code: string; name: string };
type PartyLookupSupportedType = Extract<PartyType, 'LEGAL_ENTITY' | 'IP' | 'KFH'>;
type PartyRequisitesState = {
  inn: string;
  kpp: string;
  ogrn: string;
  ogrnip: string;
  unp: string;
  bin: string;
};
type PartyAddress = { type: string; full: string };
type PartyContactState = PartyContactRecord;
type PartyBankState = PartyBankRecord;
type PendingLookupApply = {
  legalName: string;
  shortName: string;
  requisites: PartyRequisitesState;
  addresses: PartyAddress[];
  dataProvenance: PartyDataProvenance;
};
type LookupConflictKey =
  | 'legalName'
  | 'shortName'
  | 'address'
  | 'inn'
  | 'kpp'
  | 'ogrn'
  | 'ogrnip'
  | 'unp'
  | 'bin';
type LookupConflictField = {
  key: LookupConflictKey;
  label: string;
  current: string;
  found: string;
  choice: 'mine' | 'found';
};

const EMPTY_IDENTIFICATION: PartyIdentificationFormValue = {
  inn: '',
  kpp: '',
  unp: '',
  bin: '',
};

const EMPTY_REQUISITES: PartyRequisitesState = {
  inn: '',
  kpp: '',
  ogrn: '',
  ogrnip: '',
  unp: '',
  bin: '',
};

export function PartyCreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [jurisdictionsLoading, setJurisdictionsLoading] = useState(false);

  const [type, setType] = useState<PartyType>('LEGAL_ENTITY');
  const [jurisdictionId, setJurisdictionId] = useState('');
  const [legalName, setLegalName] = useState('');
  const [shortName, setShortName] = useState('');
  const [comment, setComment] = useState('');
  const [legalForm, setLegalForm] = useState('');
  const [identification, setIdentification] = useState<PartyIdentificationFormValue>(EMPTY_IDENTIFICATION);
  const [identificationSchema, setIdentificationSchema] = useState<PartyIdentificationSchema | null>(null);
  const [requisites, setRequisites] = useState<PartyRequisitesState>(EMPTY_REQUISITES);
  const [addresses, setAddresses] = useState<PartyAddress[]>([]);
  const [contacts, setContacts] = useState<PartyContactState[]>([]);
  const [banks, setBanks] = useState<PartyBankState[]>([]);
  const [dataProvenance, setDataProvenance] = useState<PartyDataProvenance | null>(null);
  const [manualIdentification, setManualIdentification] = useState(false);
  const [identificationConfirmed, setIdentificationConfirmed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<PartyLookupStatus | null>(null);
  const [lookupResponse, setLookupResponse] = useState<PartyLookupResponse | null>(null);
  const [pendingLookupApply, setPendingLookupApply] = useState<PendingLookupApply | null>(null);
  const [conflictFields, setConflictFields] = useState<LookupConflictField[]>([]);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const lastLookupRequestKeyRef = useRef<string>('');
  const handleSchemaLoaded = useCallback((schema: PartyIdentificationSchema | null) => {
    setIdentificationSchema(schema);
  }, []);

  useEffect(() => {
    let active = true;
    setJurisdictionsLoading(true);
    api.partyManagement
      .jurisdictions()
      .then((response) => {
        if (!active) {
          return;
        }
        const items = Array.isArray(response?.data) ? (response.data as Jurisdiction[]) : [];
        setJurisdictions(items);
        if (items.length > 0) {
          setJurisdictionId(items[0].id);
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }
        setJurisdictions([]);
      })
      .finally(() => {
        if (active) {
          setJurisdictionsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const lookupPartyType = useMemo<PartyLookupSupportedType | null>(() => {
    if (type === 'LEGAL_ENTITY' || type === 'IP' || type === 'KFH') {
      return type;
    }
    return null;
  }, [type]);

  const lookupIdentifiers = useMemo<PartyLookupIdentifiers>(() => {
    if (!identificationSchema) {
      return {};
    }

    return identificationSchema.fields.reduce<PartyLookupIdentifiers>((acc, field) => {
      const nextValue = identification[field.key]?.trim();
      if (nextValue) {
        acc[field.key] = nextValue;
      }
      return acc;
    }, {});
  }, [identification, identificationSchema]);

  const lookupRequest = useMemo<PartyLookupRequest | null>(() => {
    if (!identificationSchema || !lookupPartyType) {
      return null;
    }
    return {
      jurisdictionId: identificationSchema.jurisdictionId,
      partyType: lookupPartyType,
      identifiers: lookupIdentifiers,
    };
  }, [identificationSchema, lookupIdentifiers, lookupPartyType]);

  const lookupRequestKey = useMemo(() => {
    if (!lookupRequest) {
      return '';
    }
    return [
      lookupRequest.jurisdictionId,
      lookupRequest.partyType,
      lookupRequest.identifiers.inn ?? '',
      lookupRequest.identifiers.kpp ?? '',
      lookupRequest.identifiers.unp ?? '',
      lookupRequest.identifiers.bin ?? '',
    ].join(':');
  }, [lookupRequest]);

  const fieldErrors = useMemo<Partial<Record<IdentificationFieldKey, string>>>(() => {
    if (!identificationSchema) {
      return {};
    }

    return identificationSchema.fields.reduce<Partial<Record<IdentificationFieldKey, string>>>((acc, field) => {
      const value = identification[field.key]?.trim() ?? '';

      if (!value) {
        if (field.required) {
          acc[field.key] = `Поле «${field.label}» обязательно.`;
        }
        return acc;
      }

      if (value.length < field.minLength || value.length > field.maxLength) {
        acc[field.key] = `${field.label} должен содержать от ${field.minLength} до ${field.maxLength} символов.`;
        return acc;
      }

      if (identificationSchema.jurisdictionId === 'RU' && field.key === 'inn' && lookupPartyType && !isRuInnValid(value, lookupPartyType)) {
        acc[field.key] = 'ИНН не прошел checksum-проверку для выбранного типа.';
      }

      return acc;
    }, {});
  }, [identification, identificationSchema, lookupPartyType]);

  const lookupDisabledReason = useMemo(() => {
    if (!identificationSchema) {
      return 'Схема идентификации не загружена.';
    }
    if (!identificationSchema.lookup.enabled) {
      return 'Автопоиск для этой схемы пока недоступен.';
    }
    if (!lookupRequest || !lookupPartyType) {
      return 'Автопоиск доступен только для типов: Юридическое лицо, ИП, КФХ.';
    }

    const firstFieldError = Object.values(fieldErrors)[0];
    if (firstFieldError) {
      return firstFieldError;
    }

    for (const triggerKey of identificationSchema.lookup.triggerKeys) {
      const field = identificationSchema.fields.find((item) => item.key === triggerKey);
      const value = lookupRequest.identifiers[triggerKey]?.trim() ?? '';
      if (!field || !value) {
        return `Заполните поле «${field?.label ?? triggerKey.toUpperCase()}» для поиска.`;
      }
      if (value.length < field.minLength || value.length > field.maxLength) {
        return `${field.label} должен содержать от ${field.minLength} до ${field.maxLength} символов.`;
      }
    }

    const inn = lookupRequest.identifiers.inn?.trim() ?? '';
    if (identificationSchema.jurisdictionId === 'RU' && inn && !isRuInnValid(inn, lookupPartyType)) {
      return 'ИНН не прошел checksum-проверку для выбранного типа.';
    }

    return null;
  }, [fieldErrors, identificationSchema, lookupPartyType, lookupRequest]);

  const executeLookup = useCallback(async () => {
    if (!lookupRequest || lookupDisabledReason) {
      return;
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await partyAssetsApi.lookupParty(lookupRequest);
      setLookupResponse(response);
      setLookupStatus(response.status);
      if (response.status === 'ERROR') {
        setLookupError(response.error ?? 'Не удалось выполнить поиск по реквизитам.');
      } else {
        setLookupError(null);
      }
    } catch {
      setLookupStatus('ERROR');
      setLookupResponse(null);
      setLookupError('Не удалось выполнить поиск по реквизитам.');
    } finally {
      setLookupLoading(false);
    }
  }, [lookupDisabledReason, lookupRequest]);

  const commitLookupApply = useCallback(
    (payload: PendingLookupApply) => {
      if (payload.legalName) {
        setLegalName(payload.legalName);
      }
      if (payload.shortName) {
        setShortName(payload.shortName);
      }
      setRequisites(payload.requisites);
      setAddresses(payload.addresses);
      setDataProvenance(payload.dataProvenance);
      setManualIdentification(false);
      setIdentificationConfirmed(true);
    },
    [],
  );

  const applyLookupResult = useCallback(
    (response: PartyLookupResponse) => {
      const result = response.result;
      if (!result) {
        return;
      }

      const nextLegalName = result.legalName?.trim() ?? '';
      const nextShortName = result.shortName?.trim() ?? '';
      const nextRequisites: PartyRequisitesState = {
        inn: result.requisites?.inn ?? '',
        kpp: result.requisites?.kpp ?? '',
        ogrn: result.requisites?.ogrn ?? '',
        ogrnip: result.requisites?.ogrnip ?? '',
        unp: result.requisites?.unp ?? '',
        bin: result.requisites?.bin ?? '',
      };
      const nextAddresses = Array.isArray(result.addresses) ? result.addresses : [];
      const nextDataProvenance: PartyDataProvenance = {
        lookupSource: response.source,
        fetchedAt: response.fetchedAt,
        requestKey: response.requestKey || lookupRequestKey,
      };

      const requisitesFields: Array<keyof PartyRequisitesState> = ['inn', 'kpp', 'ogrn', 'ogrnip', 'unp', 'bin'];
      const currentAddress = addresses[0]?.full?.trim() ?? '';
      const lookupAddress = nextAddresses[0]?.full?.trim() ?? '';

      const payload: PendingLookupApply = {
        legalName: nextLegalName,
        shortName: nextShortName,
        requisites: nextRequisites,
        addresses: nextAddresses,
        dataProvenance: nextDataProvenance,
      };

      const nextConflicts: LookupConflictField[] = [];
      if (legalName.trim() && nextLegalName && legalName.trim() !== nextLegalName) {
        nextConflicts.push({ key: 'legalName', label: 'Юридическое наименование', current: legalName.trim(), found: nextLegalName, choice: 'mine' });
      }
      if (shortName.trim() && nextShortName && shortName.trim() !== nextShortName) {
        nextConflicts.push({ key: 'shortName', label: 'Краткое наименование', current: shortName.trim(), found: nextShortName, choice: 'mine' });
      }
      (['inn', 'kpp', 'ogrn', 'ogrnip', 'unp', 'bin'] as Array<keyof PartyRequisitesState>).forEach((field) => {
        if (requisites[field] && nextRequisites[field] && requisites[field] !== nextRequisites[field]) {
          nextConflicts.push({
            key: field,
            label: field.toUpperCase(),
            current: requisites[field],
            found: nextRequisites[field],
            choice: 'mine',
          });
        }
      });
      if (currentAddress && lookupAddress && currentAddress !== lookupAddress) {
        nextConflicts.push({ key: 'address', label: 'Юридический адрес', current: currentAddress, found: lookupAddress, choice: 'mine' });
      }

      if (nextConflicts.length > 0) {
        setPendingLookupApply(payload);
        setConflictFields(nextConflicts);
        setDiffDialogOpen(true);
        return;
      }

      commitLookupApply(payload);
      setStep(4);
    },
    [addresses, commitLookupApply, legalName, lookupRequestKey, requisites, shortName],
  );

  useEffect(() => {
    if (step !== 3 || !lookupRequest || lookupDisabledReason || !identificationSchema?.lookup.enabled) {
      return;
    }
    if (!lookupRequestKey || lookupRequestKey === lastLookupRequestKeyRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastLookupRequestKeyRef.current = lookupRequestKey;
      void executeLookup();
    }, identificationSchema.lookup.debounceMs || 800);

    return () => window.clearTimeout(timer);
  }, [executeLookup, identificationSchema, lookupDisabledReason, lookupRequest, lookupRequestKey, step]);

  useEffect(() => {
    setIdentification(EMPTY_IDENTIFICATION);
    setIdentificationSchema(null);
    setRequisites(EMPTY_REQUISITES);
    setAddresses([]);
    setContacts([]);
    setBanks([]);
    setLegalForm('');
    setDataProvenance(null);
    setManualIdentification(false);
    setIdentificationConfirmed(false);
    setLookupError(null);
    setLookupStatus(null);
    setLookupResponse(null);
    setPendingLookupApply(null);
    setConflictFields([]);
    setDiffDialogOpen(false);
    lastLookupRequestKeyRef.current = '';
  }, [jurisdictionId, type]);

  const canProceed = useMemo(() => {
    if (step === 1) {
      return Boolean(type);
    }
    if (step === 2) {
      return jurisdictionId.trim().length > 0;
    }
    if (step === 3) {
      return identificationConfirmed && !lookupLoading;
    }
    if (step === 4) {
      return legalName.trim().length > 0;
    }
    return legalName.trim().length > 0;
  }, [identificationConfirmed, jurisdictionId, legalName, lookupLoading, step, type]);

  const visibleRequisiteFields = useMemo(
    () => getPartyRequisiteFields(identificationSchema?.jurisdictionId, type),
    [identificationSchema?.jurisdictionId, type],
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const normalizedAddresses = addresses
        .map((item) => ({ type: item.type || 'LEGAL', address: item.full.trim() }))
        .filter((item) => item.address.length > 0);

      const created = await partyAssetsApi.createParty({
        type,
        legalName: legalName.trim(),
        shortName: shortName.trim() || undefined,
        jurisdictionId: jurisdictionId.trim(),
        status: 'ACTIVE',
        comment: comment.trim() || undefined,
        registrationData: {
          partyType: type,
          status: 'ACTIVE',
          shortName: shortName.trim() || undefined,
          legalForm: legalForm.trim() || undefined,
          comment: comment.trim() || undefined,
          inn: requisites.inn.trim() || undefined,
          kpp: requisites.kpp.trim() || undefined,
          ogrn: requisites.ogrn.trim() || undefined,
          ogrnip: requisites.ogrnip.trim() || undefined,
          unp: requisites.unp.trim() || undefined,
          bin: requisites.bin.trim() || undefined,
          addresses: normalizedAddresses,
          contacts: contacts
            .map((item) => ({
              roleType: item.roleType,
              fullName: item.fullName.trim(),
              position: item.position?.trim() || undefined,
              basisOfAuthority: item.basisOfAuthority?.trim() || undefined,
              phones: item.phones?.trim() || undefined,
              email: item.email?.trim() || undefined,
            }))
            .filter((item) => item.fullName.length > 0),
          banks: banks
            .map((item) => ({
              bankName: item.bankName.trim(),
              accountNumber: item.accountNumber.trim(),
              bic: item.bic?.trim() || undefined,
              corrAccount: item.corrAccount?.trim() || undefined,
              currency: item.currency?.trim() || 'RUB',
              isPrimary: item.isPrimary ?? false,
            }))
            .filter((item) => item.bankName.length > 0 && item.accountNumber.length > 0),
          dataProvenance: dataProvenance ?? undefined,
        },
      });
      router.push(`/parties/${encodeURIComponent(created.id)}`);
    } catch {
      setError('Не удалось создать контрагента.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 rounded-3xl border border-black/10 bg-white p-6">
      <div className="flex gap-2 text-sm font-medium text-gray-500">
        <span className={step >= 1 ? 'text-gray-900' : ''}>Тип</span>
        <span>/</span>
        <span className={step >= 2 ? 'text-gray-900' : ''}>Юрисдикция</span>
        <span>/</span>
        <span className={step >= 3 ? 'text-gray-900' : ''}>Идентификация</span>
        <span>/</span>
        <span className={step >= 4 ? 'text-gray-900' : ''}>Профиль</span>
        <span>/</span>
        <span className={step >= 5 ? 'text-gray-900' : ''}>Реквизиты</span>
        <span>/</span>
        <span className={step >= 6 ? 'text-gray-900' : ''}>Связи (опционально)</span>
      </div>

      {step === 1 ? (
        <div className="flex flex-wrap gap-3">
          {PARTY_TYPES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setType(item)}
              className={`inline-flex w-fit max-w-full items-center rounded-2xl border px-4 py-2.5 text-left text-sm font-medium transition-colors ${
                type === item ? 'border-black/30 bg-white text-gray-900' : 'border-black/10 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {partyTypeLabel(item)}
            </button>
          ))}
        </div>
      ) : null}

      {step === 2 ? (
        <div>
          <label className="mb-2 block text-sm font-normal text-gray-700">Юрисдикция</label>
          <select
            value={jurisdictionId}
            onChange={(event) => setJurisdictionId(event.target.value)}
            className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-normal text-gray-900 outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
            disabled={jurisdictionsLoading}
          >
            <option value="">
              {jurisdictionsLoading ? 'Загрузка юрисдикций...' : 'Выберите юрисдикцию'}
            </option>
            {jurisdictions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {step === 3 ? (
        <PartyIdentificationStep
          jurisdictionId={jurisdictionId}
          partyType={type}
          value={identification}
          onChangeField={(key, nextValue) => {
            setIdentification((prev) => ({ ...prev, [key]: nextValue }));
            setLookupError(null);
            setLookupStatus(null);
            setLookupResponse(null);
            setIdentificationConfirmed(false);
            setManualIdentification(false);
          }}
          onSchemaLoaded={handleSchemaLoaded}
          onLookup={() => {
            if (!lookupRequestKey) {
              return;
            }
            lastLookupRequestKeyRef.current = lookupRequestKey;
            setManualIdentification(false);
            void executeLookup();
          }}
          onApply={() => {
            if (lookupResponse?.status !== 'FOUND' || !lookupResponse.result) {
              return;
            }
            applyLookupResult(lookupResponse);
          }}
          onManual={() => {
            setManualIdentification(true);
            setIdentificationConfirmed(true);
            setDataProvenance(null);
          }}
          lookupLoading={lookupLoading}
          lookupError={lookupError}
          lookupStatus={lookupStatus}
          lookupResult={lookupResponse?.status === 'FOUND' ? lookupResponse.result : null}
          lookupSource={lookupResponse?.source ?? null}
          lookupFetchedAt={lookupResponse?.fetchedAt ?? null}
          fieldErrors={fieldErrors}
          lookupDisabledReason={lookupDisabledReason}
        />
      ) : null}

      {step === 4 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {dataProvenance ? (
            <div className="md:col-span-2">
              <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                Заполнено из {dataProvenance.lookupSource} {formatLookupBadgeDate(dataProvenance.fetchedAt)}
              </span>
            </div>
          ) : null}
          {manualIdentification && !dataProvenance ? (
            <div className="md:col-span-2">
              <span className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                Данные заполнены вручную
              </span>
            </div>
          ) : null}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-normal text-gray-700">Юридическое наименование</label>
            <input
              value={legalName}
              onChange={(event) => setLegalName(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="ООО Агротрейд"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Краткое наименование</label>
            <input
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Агротрейд"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">Комментарий</label>
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="Комментарий"
            />
          </div>
        </div>
      ) : null}

      {step === 5 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-normal text-gray-700">Организационно-правовая форма</label>
              <input
                value={legalForm}
                onChange={(event) => setLegalForm(event.target.value)}
                className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                placeholder="ООО, АО, ИП"
              />
            </div>
            {visibleRequisiteFields.map((field) => {
              if (field.key === 'legalAddress') {
                return (
                  <div key={field.key} className="md:col-span-2">
                    <label className="mb-2 block text-sm font-normal text-gray-700">{field.label}</label>
                    <input
                      value={addresses[0]?.full ?? ''}
                      onChange={(event) =>
                        setAddresses((prev) => {
                          const next = [...prev];
                          if (!next[0]) {
                            next[0] = { type: 'LEGAL', full: '' };
                          }
                          next[0] = { ...next[0], type: 'LEGAL', full: event.target.value };
                          return next;
                        })
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder={field.label}
                    />
                  </div>
                );
              }

              return (
                <div key={field.key}>
                  <label className="mb-2 block text-sm font-normal text-gray-700">{field.label}</label>
                  <input
                    value={requisites[field.key]}
                    onChange={(event) => setRequisites((prev) => ({ ...prev, [field.key]: event.target.value.trim() }))}
                    className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                    placeholder={field.label}
                  />
                </div>
              );
            })}
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Банковские счета</p>
                <p className="text-sm font-normal text-gray-500">Расчётные счета, БИК/SWIFT, корреспондентские счета.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBanks((prev) => [
                    ...prev,
                    { bankName: '', accountNumber: '', bic: '', corrAccount: '', currency: 'RUB', isPrimary: prev.length === 0 },
                  ])
                }
                className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                + Добавить счёт
              </button>
            </div>
            {banks.length === 0 ? <p className="text-sm font-normal text-gray-500">Банковские счета пока не добавлены.</p> : null}
            {banks.map((bank, index) => (
              <div key={`${index}-${bank.bankName}`} className="rounded-2xl border border-black/10 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Наименование банка</label>
                    <input
                      value={bank.bankName}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, bankName: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="АО Банк"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Расчётный счёт / IBAN</label>
                    <input
                      value={bank.accountNumber}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, accountNumber: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="40702810..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">БИК / SWIFT</label>
                    <input
                      value={bank.bic ?? ''}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, bic: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="044525225"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Корреспондентский счёт</label>
                    <input
                      value={bank.corrAccount ?? ''}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, corrAccount: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="30101810..."
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm font-normal text-gray-700">
                    <input
                      type="checkbox"
                      checked={bank.isPrimary ?? false}
                      onChange={(event) =>
                        setBanks((prev) =>
                          prev.map((item, itemIndex) => ({
                            ...item,
                            isPrimary: itemIndex === index ? event.target.checked : event.target.checked ? false : item.isPrimary,
                          })),
                        )
                      }
                    />
                    Основной счёт
                  </label>
                  <button
                    type="button"
                    onClick={() => setBanks((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-sm font-medium text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">Контакты</p>
                <p className="text-sm font-normal text-gray-500">Подписанты и операционные контакты контрагента.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setContacts((prev) => [
                    ...prev,
                    { roleType: 'OPERATIONAL', fullName: '', position: '', basisOfAuthority: '', phones: '', email: '' },
                  ])
                }
                className="rounded-2xl border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
              >
                + Добавить контакт
              </button>
            </div>
            {contacts.length === 0 ? <p className="text-sm font-normal text-gray-500">Контакты пока не добавлены.</p> : null}
            {contacts.map((contact, index) => (
              <div key={`${index}-${contact.fullName}`} className="rounded-2xl border border-black/10 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Тип контакта</label>
                    <select
                      value={contact.roleType}
                      onChange={(event) =>
                        setContacts((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index ? { ...item, roleType: event.target.value as PartyContactState['roleType'] } : item,
                          ),
                        )
                      }
                      className="w-full rounded-lg border border-black/10 bg-white px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                    >
                      <option value="SIGNATORY">Подписант</option>
                      <option value="OPERATIONAL">Операционный</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">ФИО</label>
                    <input
                      value={contact.fullName}
                      onChange={(event) =>
                        setContacts((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, fullName: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="Иванов Иван Иванович"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Должность</label>
                    <input
                      value={contact.position ?? ''}
                      onChange={(event) =>
                        setContacts((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, position: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="Генеральный директор"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Основание полномочий</label>
                    <input
                      value={contact.basisOfAuthority ?? ''}
                      onChange={(event) =>
                        setContacts((prev) =>
                          prev.map((item, itemIndex) => (itemIndex === index ? { ...item, basisOfAuthority: event.target.value } : item)),
                        )
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="Устав / доверенность"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Телефон</label>
                    <input
                      value={contact.phones ?? ''}
                      onChange={(event) =>
                        setContacts((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, phones: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="+7 ..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Email</label>
                    <input
                      value={contact.email ?? ''}
                      onChange={(event) =>
                        setContacts((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, email: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="mail@company.ru"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setContacts((prev) => prev.filter((_, itemIndex) => itemIndex !== index))}
                    className="text-sm font-medium text-red-600"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </section>
        </div>
      ) : null}

      {step === 6 ? (
        <div className="rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-700">
          Связи между контрагентами назначаются после создания в карточке, во вкладках «Структура» и «Активы».
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
        {step < 6 ? (
          <button
            type="button"
            onClick={() => setStep((prev) => Math.min(6, prev + 1))}
            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            disabled={!canProceed}
          >
            Далее
          </button>
        ) : (
          <button
            type="button"
            onClick={save}
            className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            disabled={saving || !canProceed}
          >
            {saving ? 'Создание...' : 'Создать контрагента'}
          </button>
        )}
      </div>

      <PartyLookupDiffDialog
        open={diffDialogOpen}
        conflicts={conflictFields}
        onChangeChoice={(key, choice) => {
          setConflictFields((prev) => prev.map((item) => (item.key === key ? { ...item, choice } : item)));
        }}
        onCancel={() => {
          setDiffDialogOpen(false);
          setPendingLookupApply(null);
          setConflictFields([]);
        }}
        onConfirm={() => {
          if (pendingLookupApply) {
            const resolvedPayload: PendingLookupApply = {
              ...pendingLookupApply,
              requisites: { ...pendingLookupApply.requisites },
              addresses: [...pendingLookupApply.addresses],
            };

            conflictFields.forEach((field) => {
              if (field.choice === 'found') {
                return;
              }
              switch (field.key) {
                case 'legalName':
                  resolvedPayload.legalName = legalName.trim();
                  break;
                case 'shortName':
                  resolvedPayload.shortName = shortName.trim();
                  break;
                case 'address':
                  resolvedPayload.addresses = currentAddresses(addresses);
                  break;
                case 'inn':
                case 'kpp':
                case 'ogrn':
                case 'ogrnip':
                case 'unp':
                case 'bin':
                  resolvedPayload.requisites[field.key] = requisites[field.key];
                  break;
              }
            });

            commitLookupApply(resolvedPayload);
            setStep(4);
          }
          setDiffDialogOpen(false);
          setPendingLookupApply(null);
          setConflictFields([]);
        }}
      />
    </div>
  );
}

function currentAddresses(addresses: PartyAddress[]): PartyAddress[] {
  if (addresses.length === 0) {
    return [];
  }
  return addresses.map((item) => ({ ...item }));
}

function PartyLookupDiffDialog({
  open,
  conflicts,
  onChangeChoice,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  conflicts: LookupConflictField[];
  onChangeChoice: (key: LookupConflictKey, choice: 'mine' | 'found') => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-4xl rounded-2xl border border-black/10 bg-white p-6">
        <h3 className="text-lg font-medium text-gray-900">Выберите значения для применения</h3>
        <p className="mt-2 text-sm font-normal text-gray-600">
          Найдены различия между введёнными и найденными данными. Для каждого поля выберите источник значения.
        </p>
        <div className="mt-6 space-y-3">
          {conflicts.map((field) => (
            <div key={field.key} className="rounded-2xl border border-black/10 p-4">
              <p className="text-sm font-medium text-gray-900">{field.label}</p>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onChangeChoice(field.key, 'mine')}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-normal transition-colors ${
                    field.choice === 'mine' ? 'border-black/30 bg-gray-50 text-gray-900' : 'border-black/10 text-gray-700'
                  }`}
                >
                  <span className="block text-xs font-medium text-gray-500">Оставить моё</span>
                  <span className="mt-1 block">{field.current || '—'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChangeChoice(field.key, 'found')}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-normal transition-colors ${
                    field.choice === 'found' ? 'border-black/30 bg-gray-50 text-gray-900' : 'border-black/10 text-gray-700'
                  }`}
                >
                  <span className="block text-xs font-medium text-gray-500">Использовать найденное</span>
                  <span className="mt-1 block">{field.found || '—'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-2xl border border-black/10 px-6 py-3 text-sm font-medium transition-colors hover:bg-gray-50">
            Отмена
          </button>
          <button type="button" onClick={onConfirm} className="rounded-2xl bg-black px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800">
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
