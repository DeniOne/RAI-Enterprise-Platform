'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyType } from '@/shared/types/party-assets';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';
import { api } from '@/lib/api';
import { ConfirmDialog } from '@/components/party-assets/common/ConfirmDialog';
import { PartyIdentificationFormValue, PartyIdentificationStep } from './PartyIdentificationStep';
import { formatLookupBadgeDate, isRuInnValid, resolveLookupJurisdictionCode } from '@/shared/lib/party-lookup';
import {
  PartyDataProvenance,
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
type PendingLookupApply = {
  legalName: string;
  shortName: string;
  requisites: PartyRequisitesState;
  addresses: PartyAddress[];
  dataProvenance: PartyDataProvenance;
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
  const [identification, setIdentification] = useState<PartyIdentificationFormValue>(EMPTY_IDENTIFICATION);
  const [requisites, setRequisites] = useState<PartyRequisitesState>(EMPTY_REQUISITES);
  const [addresses, setAddresses] = useState<PartyAddress[]>([]);
  const [dataProvenance, setDataProvenance] = useState<PartyDataProvenance | null>(null);
  const [manualIdentification, setManualIdentification] = useState(false);
  const [identificationConfirmed, setIdentificationConfirmed] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupStatus, setLookupStatus] = useState<PartyLookupStatus | null>(null);
  const [lookupResponse, setLookupResponse] = useState<PartyLookupResponse | null>(null);
  const [pendingLookupApply, setPendingLookupApply] = useState<PendingLookupApply | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const [diffMessage, setDiffMessage] = useState('');
  const lastLookupRequestKeyRef = useRef<string>('');

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

  const selectedJurisdiction = useMemo(
    () => jurisdictions.find((item) => item.id === jurisdictionId),
    [jurisdictionId, jurisdictions],
  );

  const lookupJurisdiction = useMemo(
    () => resolveLookupJurisdictionCode(selectedJurisdiction?.code),
    [selectedJurisdiction?.code],
  );

  const lookupPartyType = useMemo<PartyLookupSupportedType | null>(() => {
    if (type === 'LEGAL_ENTITY' || type === 'IP' || type === 'KFH') {
      return type;
    }
    return null;
  }, [type]);

  const lookupRequest = useMemo<PartyLookupRequest | null>(() => {
    if (!lookupJurisdiction || !lookupPartyType) {
      return null;
    }
    return {
      jurisdictionId: lookupJurisdiction,
      partyType: lookupPartyType,
      query: {
        inn: identification.inn || undefined,
        kpp: identification.kpp || undefined,
        unp: identification.unp || undefined,
        bin: identification.bin || undefined,
      },
    };
  }, [identification.bin, identification.inn, identification.kpp, identification.unp, lookupJurisdiction, lookupPartyType]);

  const lookupRequestKey = useMemo(() => {
    if (!lookupRequest) {
      return '';
    }
    return [
      lookupRequest.jurisdictionId,
      lookupRequest.partyType,
      lookupRequest.query.inn ?? '',
      lookupRequest.query.kpp ?? '',
      lookupRequest.query.unp ?? '',
      lookupRequest.query.bin ?? '',
    ].join(':');
  }, [lookupRequest]);

  const innValidationError = useMemo(() => {
    if (!lookupRequest || lookupRequest.jurisdictionId !== 'RU') {
      return null;
    }
    const inn = lookupRequest.query.inn?.trim() ?? '';
    if (!inn) {
      return null;
    }
    if (!isRuInnValid(inn, lookupRequest.partyType)) {
      return 'ИНН не прошел checksum-проверку для выбранного типа.';
    }
    return null;
  }, [lookupRequest]);

  const lookupDisabledReason = useMemo(() => {
    if (!lookupJurisdiction) {
      return 'Для выбранной юрисдикции автопоиск недоступен.';
    }
    if (!lookupPartyType || !lookupRequest) {
      return 'Автопоиск доступен только для типов: Юридическое лицо, ИП, КФХ.';
    }

    if (lookupJurisdiction === 'RU') {
      if (!lookupRequest.query.inn) {
        return 'Введите ИНН для поиска.';
      }
      if (lookupPartyType === 'LEGAL_ENTITY' && lookupRequest.query.inn.length !== 10) {
        return 'Для юридического лица ИНН должен содержать 10 цифр.';
      }
      if ((lookupPartyType === 'IP' || lookupPartyType === 'KFH') && lookupRequest.query.inn.length !== 12) {
        return 'Для ИП/КФХ ИНН должен содержать 12 цифр.';
      }
      if (lookupRequest.query.kpp && lookupRequest.query.kpp.length !== 9) {
        return 'КПП должен содержать 9 цифр.';
      }
      if (innValidationError) {
        return innValidationError;
      }
      return null;
    }

    if (lookupJurisdiction === 'BY') {
      if (!lookupRequest.query.unp) {
        return 'Введите УНП для поиска.';
      }
      return null;
    }

    if (lookupJurisdiction === 'KZ') {
      if (!lookupRequest.query.bin) {
        return 'Введите БИН для поиска.';
      }
      if (lookupRequest.query.bin.length !== 12) {
        return 'БИН должен содержать 12 цифр.';
      }
      return null;
    }

    return 'Для выбранной юрисдикции автопоиск недоступен.';
  }, [innValidationError, lookupJurisdiction, lookupPartyType, lookupRequest]);

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
      if (!shortName.trim() && payload.shortName) {
        setShortName(payload.shortName);
      }
      setRequisites(payload.requisites);
      setAddresses(payload.addresses);
      setDataProvenance(payload.dataProvenance);
      setManualIdentification(false);
      setIdentificationConfirmed(true);
    },
    [shortName],
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

      const diff: string[] = [];
      if (legalName.trim() && nextLegalName && legalName.trim() !== nextLegalName) {
        diff.push(`Юр. наименование: "${legalName.trim()}" -> "${nextLegalName}"`);
      }
      if (shortName.trim() && nextShortName && shortName.trim() !== nextShortName) {
        diff.push(`Краткое наименование: "${shortName.trim()}" -> "${nextShortName}"`);
      }
      const requisitesFields: Array<keyof PartyRequisitesState> = ['inn', 'kpp', 'ogrn', 'ogrnip', 'unp', 'bin'];
      requisitesFields.forEach((field) => {
        if (requisites[field] && nextRequisites[field] && requisites[field] !== nextRequisites[field]) {
          diff.push(`${field.toUpperCase()}: "${requisites[field]}" -> "${nextRequisites[field]}"`);
        }
      });
      const currentAddress = addresses[0]?.full?.trim() ?? '';
      const lookupAddress = nextAddresses[0]?.full?.trim() ?? '';
      if (currentAddress && lookupAddress && currentAddress !== lookupAddress) {
        diff.push(`Адрес: "${currentAddress}" -> "${lookupAddress}"`);
      }

      const payload: PendingLookupApply = {
        legalName: nextLegalName,
        shortName: nextShortName,
        requisites: nextRequisites,
        addresses: nextAddresses,
        dataProvenance: nextDataProvenance,
      };

      if (diff.length > 0) {
        setPendingLookupApply(payload);
        setDiffMessage(diff.join(' | '));
        setDiffDialogOpen(true);
        return;
      }

      commitLookupApply(payload);
    },
    [addresses, commitLookupApply, legalName, lookupRequestKey, requisites, shortName],
  );

  useEffect(() => {
    if (step !== 3 || !lookupRequest || lookupDisabledReason) {
      return;
    }
    if (!lookupRequestKey || lookupRequestKey === lastLookupRequestKeyRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      lastLookupRequestKeyRef.current = lookupRequestKey;
      void executeLookup();
    }, 800);

    return () => window.clearTimeout(timer);
  }, [executeLookup, lookupDisabledReason, lookupRequest, lookupRequestKey, step]);

  useEffect(() => {
    setIdentification(EMPTY_IDENTIFICATION);
    setRequisites(EMPTY_REQUISITES);
    setAddresses([]);
    setDataProvenance(null);
    setManualIdentification(false);
    setIdentificationConfirmed(false);
    setLookupError(null);
    setLookupStatus(null);
    setLookupResponse(null);
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
          shortName: shortName.trim() || undefined,
          comment: comment.trim() || undefined,
          inn: requisites.inn.trim() || undefined,
          kpp: requisites.kpp.trim() || undefined,
          ogrn: requisites.ogrn.trim() || undefined,
          ogrnip: requisites.ogrnip.trim() || undefined,
          unp: requisites.unp.trim() || undefined,
          bin: requisites.bin.trim() || undefined,
          addresses: normalizedAddresses,
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
          partyType={type}
          jurisdictionCode={selectedJurisdiction?.code ?? null}
          value={identification}
          onChange={(patch) => {
            setIdentification((prev) => ({ ...prev, ...patch }));
            setLookupError(null);
            setLookupStatus(null);
            setLookupResponse(null);
            setIdentificationConfirmed(false);
            setManualIdentification(false);
          }}
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
          innValidationError={innValidationError}
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">ИНН</label>
            <input
              value={requisites.inn}
              onChange={(event) => setRequisites((prev) => ({ ...prev, inn: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="ИНН"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">КПП</label>
            <input
              value={requisites.kpp}
              onChange={(event) => setRequisites((prev) => ({ ...prev, kpp: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="КПП"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">ОГРН</label>
            <input
              value={requisites.ogrn}
              onChange={(event) => setRequisites((prev) => ({ ...prev, ogrn: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="ОГРН"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">ОГРНИП</label>
            <input
              value={requisites.ogrnip}
              onChange={(event) => setRequisites((prev) => ({ ...prev, ogrnip: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="ОГРНИП"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">УНП</label>
            <input
              value={requisites.unp}
              onChange={(event) => setRequisites((prev) => ({ ...prev, unp: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="УНП"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-normal text-gray-700">БИН</label>
            <input
              value={requisites.bin}
              onChange={(event) => setRequisites((prev) => ({ ...prev, bin: event.target.value.trim() }))}
              className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
              placeholder="БИН"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-normal text-gray-700">Юридический адрес</label>
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
              placeholder="Юридический адрес"
            />
          </div>
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

      <ConfirmDialog
        open={diffDialogOpen}
        title="Подтвердите перезапись данных"
        message={`Найдены отличия с уже введенными полями: ${diffMessage}`}
        onCancel={() => {
          setDiffDialogOpen(false);
          setPendingLookupApply(null);
        }}
        onConfirm={() => {
          if (pendingLookupApply) {
            commitLookupApply(pendingLookupApply);
          }
          setDiffDialogOpen(false);
          setPendingLookupApply(null);
        }}
      />
    </div>
  );
}
