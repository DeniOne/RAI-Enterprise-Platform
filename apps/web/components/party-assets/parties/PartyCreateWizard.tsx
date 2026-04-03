'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { partyAssetsApi } from '@/lib/party-assets-api';
import { PartyBankRecord, PartyContactRecord, PartyType } from '@/shared/types/party-assets';
import { partyTypeLabel } from '@/shared/lib/party-assets-labels';
import { api } from '@/lib/api';
import { PartyIdentificationFormValue, PartyIdentificationStep } from './PartyIdentificationStep';
import { formatLookupBadgeDate, isRuInnValid } from '@/shared/lib/party-lookup';
import { getPartyRequisiteFields } from '@/shared/lib/party-requisites-schema';
import { BankAccountSchema } from '@/shared/lib/party-schemas';
import { formatStatusLabel } from '@/lib/ui-language';
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
type BankLookupUiState = {
  status: 'idle' | 'loading' | 'success' | 'not_found' | 'error';
  message?: string;
  source?: string;
};
type BankFieldErrorState = Partial<Record<'accountNumber' | 'bic' | 'corrAccount' | 'bankName', string>>;
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
  const [bankLookupStates, setBankLookupStates] = useState<BankLookupUiState[]>([]);
  const [bankFieldErrors, setBankFieldErrors] = useState<BankFieldErrorState[]>([]);
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
  const bankLookupTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const bankLastLookupBicRef = useRef<Record<number, string>>({});
  const handleSchemaLoaded = useCallback((schema: PartyIdentificationSchema | null) => {
    setIdentificationSchema(schema);
  }, []);

  const setBankLookupStateAt = useCallback((index: number, value: BankLookupUiState) => {
    setBankLookupStates((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const setBankFieldErrorAt = useCallback((index: number, value: BankFieldErrorState) => {
    setBankFieldErrors((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const patchBankAt = useCallback((index: number, patch: Partial<PartyBankState>) => {
    setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }, []);

  const runBankLookup = useCallback(async (index: number, bic: string) => {
    setBankLookupStateAt(index, { status: 'loading', message: 'Проверяем БИК в банковом справочнике…' });

    try {
      const response = await partyAssetsApi.lookupBankByBic(bic);
      bankLastLookupBicRef.current[index] = bic;

      if (response.status === 'FOUND' && response.result) {
        patchBankAt(index, {
          bic,
          bankName: response.result.paymentName || response.result.bankName || '',
          corrAccount: response.result.corrAccount || '',
          swift: response.result.swift || '',
          inn: response.result.inn || '',
          kpp: response.result.kpp || '',
          address: response.result.address || '',
          status: response.result.status || '',
          lookupSource: response.source,
          lookupReferenceBankName: response.result.paymentName || response.result.bankName || '',
          lookupReferenceCorrAccount: response.result.corrAccount || '',
          lookupReferenceInn: response.result.inn || '',
          lookupReferenceKpp: response.result.kpp || '',
        });
        setBankLookupStateAt(index, {
          status: 'success',
          source: response.source,
          message: response.result.corrAccount
            ? `Банк и корр. счет заполнены автоматически из ${response.source}.`
            : `Банк найден в ${response.source}. Проверь корр. счет вручную.`,
        });
        return;
      }

      if (response.status === 'NOT_FOUND') {
        setBankLookupStateAt(index, {
          status: 'not_found',
          source: response.source,
          message: 'По этому БИК банк не найден. Проверь цифры или заполни реквизиты вручную.',
        });
        return;
      }

      setBankLookupStateAt(index, {
        status: 'error',
        source: response.source,
        message: response.error || 'Не удалось получить реквизиты банка автоматически.',
      });
    } catch {
      setBankLookupStateAt(index, {
        status: 'error',
        message: 'Сервис автозаполнения банка сейчас недоступен. Поля можно заполнить вручную.',
      });
    }
  }, [patchBankAt, setBankLookupStateAt]);

  const scheduleBankLookup = useCallback((index: number, rawBic: string) => {
    const bic = rawBic.replace(/\D/g, '').slice(0, 9);
    const currentTimer = bankLookupTimersRef.current[index];
    if (currentTimer) {
      clearTimeout(currentTimer);
    }

    if (bic.length !== 9) {
      setBankLookupStateAt(index, { status: 'idle' });
      return;
    }

    if (bankLastLookupBicRef.current[index] === bic) {
      return;
    }

    bankLookupTimersRef.current[index] = setTimeout(() => {
      void runBankLookup(index, bic);
    }, 450);
  }, [runBankLookup, setBankLookupStateAt]);

  const validateBanks = useCallback(() => {
    let hasError = false;
    const nextErrors: BankFieldErrorState[] = banks.map(() => ({}));

    banks.forEach((bank, index) => {
      const hasAnyValue = [bank.bankName, bank.accountNumber, bank.bic, bank.corrAccount].some(
        (value) => String(value || '').trim().length > 0,
      );

      if (!hasAnyValue) {
        return;
      }

      const parsed = BankAccountSchema.safeParse({
        accountName: bank.accountName?.trim() || `Счет ${index + 1}`,
        accountNumber: String(bank.accountNumber || '').trim(),
        bic: String(bank.bic || '').trim(),
        bankName: String(bank.bankName || '').trim(),
        swift: String(bank.swift || '').trim(),
        corrAccount: String(bank.corrAccount || '').trim(),
        inn: String(bank.inn || '').trim(),
        kpp: String(bank.kpp || '').trim(),
        address: String(bank.address || '').trim(),
        status: String(bank.status || '').trim(),
        lookupSource: String(bank.lookupSource || '').trim(),
        lookupReferenceBankName: String(bank.lookupReferenceBankName || '').trim(),
        lookupReferenceCorrAccount: String(bank.lookupReferenceCorrAccount || '').trim(),
        lookupReferenceInn: String(bank.lookupReferenceInn || '').trim(),
        lookupReferenceKpp: String(bank.lookupReferenceKpp || '').trim(),
        currency: String(bank.currency || 'RUB').trim(),
        isPrimary: Boolean(bank.isPrimary),
      });

      if (!parsed.success) {
        hasError = true;
        const flattened = parsed.error.flatten().fieldErrors;
        nextErrors[index] = {
          accountNumber: flattened.accountNumber?.[0],
          bic: flattened.bic?.[0],
          corrAccount: flattened.corrAccount?.[0],
          bankName: flattened.bankName?.[0],
        };
      } else {
        patchBankAt(index, parsed.data);
      }
    });

    setBankFieldErrors(nextErrors);
    return !hasError;
  }, [banks, patchBankAt]);

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
    setBankLookupStates([]);
    setBankFieldErrors([]);
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
    Object.values(bankLookupTimersRef.current).forEach((timer) => clearTimeout(timer));
    bankLookupTimersRef.current = {};
    bankLastLookupBicRef.current = {};
  }, [jurisdictionId, type]);

  useEffect(() => {
    return () => {
      Object.values(bankLookupTimersRef.current).forEach((timer) => clearTimeout(timer));
    };
  }, []);

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
    if (!validateBanks()) {
      setError('Проверь банковские счета: есть невалидные реквизиты или расхождения с банком по БИК.');
      setStep(5);
      return;
    }

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
              accountName: item.accountName?.trim() || undefined,
              bankName: item.bankName.trim(),
              accountNumber: item.accountNumber.trim(),
              bic: item.bic?.trim() || undefined,
              swift: item.swift?.trim() || undefined,
              corrAccount: item.corrAccount?.trim() || undefined,
              inn: item.inn?.trim() || undefined,
              kpp: item.kpp?.trim() || undefined,
              address: item.address?.trim() || undefined,
              status: item.status?.trim() || undefined,
              lookupSource: item.lookupSource?.trim() || undefined,
              lookupReferenceBankName: item.lookupReferenceBankName?.trim() || undefined,
              lookupReferenceCorrAccount: item.lookupReferenceCorrAccount?.trim() || undefined,
              lookupReferenceInn: item.lookupReferenceInn?.trim() || undefined,
              lookupReferenceKpp: item.lookupReferenceKpp?.trim() || undefined,
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
                <p className="text-sm font-normal text-gray-500">Расчётные счета, БИК, международные банковские коды и корреспондентские счета.</p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setBanks((prev) => {
                    setBankLookupStates((lookupPrev) => [...lookupPrev, { status: 'idle' }]);
                    setBankFieldErrors((errorPrev) => [...errorPrev, {}]);
                    return [
                      ...prev,
                      {
                        accountName: prev.length === 0 ? 'Основной расчетный счет' : `Счет ${prev.length + 1}`,
                        bankName: '',
                        accountNumber: '',
                        bic: '',
                        swift: '',
                        corrAccount: '',
                        inn: '',
                        kpp: '',
                        address: '',
                        status: '',
                        lookupSource: '',
                        lookupReferenceBankName: '',
                        lookupReferenceCorrAccount: '',
                        lookupReferenceInn: '',
                        lookupReferenceKpp: '',
                        currency: 'RUB',
                        isPrimary: prev.length === 0,
                      },
                    ];
                  })
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
                      className={`w-full rounded-lg px-4 py-2 text-sm font-normal outline-none focus:ring-2 ${bankFieldErrors[index]?.bankName ? 'border border-red-300 focus:border-red-300 focus:ring-red-100' : 'border border-black/10 focus:border-black/20 focus:ring-black/20'}`}
                      placeholder="АО Банк"
                    />
                    {bankFieldErrors[index]?.bankName ? <p className="mt-1 text-xs text-red-600">{bankFieldErrors[index]?.bankName}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Расчётный счёт / международный номер счёта</label>
                    <input
                      value={bank.accountNumber}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, accountNumber: event.target.value.replace(/\D/g, '').slice(0, 20) } : item)))
                      }
                      className={`w-full rounded-lg px-4 py-2 text-sm font-normal outline-none focus:ring-2 ${bankFieldErrors[index]?.accountNumber ? 'border border-red-300 focus:border-red-300 focus:ring-red-100' : 'border border-black/10 focus:border-black/20 focus:ring-black/20'}`}
                      placeholder="40702810..."
                    />
                    {bankFieldErrors[index]?.accountNumber ? <p className="mt-1 text-xs text-red-600">{bankFieldErrors[index]?.accountNumber}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">БИК / международный код банка</label>
                    <input
                      value={bank.bic ?? ''}
                      onChange={(event) => {
                        const normalizedBic = event.target.value.replace(/\D/g, '').slice(0, 9);
                        setBanks((prev) =>
                          prev.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  bic: normalizedBic,
                                  swift: normalizedBic === item.bic ? item.swift : '',
                                  corrAccount: normalizedBic === item.bic ? item.corrAccount : '',
                                  inn: normalizedBic === item.bic ? item.inn : '',
                                  kpp: normalizedBic === item.bic ? item.kpp : '',
                                  address: normalizedBic === item.bic ? item.address : '',
                                  status: normalizedBic === item.bic ? item.status : '',
                                  lookupSource: normalizedBic === item.bic ? item.lookupSource : '',
                                  lookupReferenceBankName: normalizedBic === item.bic ? item.lookupReferenceBankName : '',
                                  lookupReferenceCorrAccount: normalizedBic === item.bic ? item.lookupReferenceCorrAccount : '',
                                  lookupReferenceInn: normalizedBic === item.bic ? item.lookupReferenceInn : '',
                                  lookupReferenceKpp: normalizedBic === item.bic ? item.lookupReferenceKpp : '',
                                }
                              : item,
                          ),
                        );
                        setBankFieldErrorAt(index, {
                          ...bankFieldErrors[index],
                          bic: undefined,
                          corrAccount: undefined,
                          accountNumber: undefined,
                          bankName: undefined,
                        });
                        scheduleBankLookup(index, normalizedBic);
                      }}
                      className={`w-full rounded-lg px-4 py-2 text-sm font-normal outline-none focus:ring-2 ${bankFieldErrors[index]?.bic ? 'border border-red-300 focus:border-red-300 focus:ring-red-100' : 'border border-black/10 focus:border-black/20 focus:ring-black/20'}`}
                      placeholder="044525225"
                    />
                    {bankFieldErrors[index]?.bic ? <p className="mt-1 text-xs text-red-600">{bankFieldErrors[index]?.bic}</p> : null}
                    <div className="mt-2 min-h-[18px]">
                      {bankLookupStates[index]?.status === 'loading' ? (
                        <div className="flex items-center gap-2 text-xs text-blue-600">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{bankLookupStates[index]?.message}</span>
                        </div>
                      ) : null}
                      {bankLookupStates[index]?.status === 'success' ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700">
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>{bankLookupStates[index]?.message}</span>
                        </div>
                      ) : null}
                      {bankLookupStates[index]?.status === 'not_found' ? (
                        <div className="flex items-center gap-2 text-xs text-amber-700">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{bankLookupStates[index]?.message}</span>
                        </div>
                      ) : null}
                      {bankLookupStates[index]?.status === 'error' ? (
                        <div className="flex items-center gap-2 text-xs text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span>{bankLookupStates[index]?.message}</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-normal text-gray-700">Корреспондентский счёт</label>
                    <input
                      value={bank.corrAccount ?? ''}
                      onChange={(event) =>
                        setBanks((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, corrAccount: event.target.value.replace(/\D/g, '').slice(0, 20) } : item)))
                      }
                      className={`w-full rounded-lg px-4 py-2 text-sm font-normal outline-none focus:ring-2 ${bankFieldErrors[index]?.corrAccount ? 'border border-red-300 focus:border-red-300 focus:ring-red-100' : 'border border-black/10 focus:border-black/20 focus:ring-black/20'}`}
                      placeholder="30101810..."
                    />
                    {bankFieldErrors[index]?.corrAccount ? <p className="mt-1 text-xs text-red-600">{bankFieldErrors[index]?.corrAccount}</p> : null}
                  </div>
                </div>
                {(bank.status || bank.inn || bank.kpp || bank.address) ? (
                  <div className="mt-4 rounded-2xl border border-black/10 bg-gray-50 p-4 text-sm text-gray-700">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Данные банка из справочника</div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {bank.status ? <div><span className="text-gray-500">Статус: </span><span className="font-medium">{bank.status === 'ACTIVE' ? 'Банк действует' : formatStatusLabel(bank.status)}</span></div> : null}
                      {(bank.inn || bank.kpp) ? <div><span className="text-gray-500">Реквизиты банка: </span><span className="font-medium">{[bank.inn ? `ИНН ${bank.inn}` : '', bank.kpp ? `КПП ${bank.kpp}` : ''].filter(Boolean).join(' • ')}</span></div> : null}
                      {bank.address ? <div><span className="text-gray-500">Адрес: </span><span className="font-medium">{bank.address}</span></div> : null}
                    </div>
                  </div>
                ) : null}
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
                    onClick={() => {
                      setBanks((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                      setBankLookupStates((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                      setBankFieldErrors((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                      const currentTimer = bankLookupTimersRef.current[index];
                      if (currentTimer) {
                        clearTimeout(currentTimer);
                      }
                      delete bankLookupTimersRef.current[index];
                      delete bankLastLookupBicRef.current[index];
                    }}
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
                    <label className="mb-2 block text-sm font-normal text-gray-700">Электронная почта</label>
                    <input
                      value={contact.email ?? ''}
                      onChange={(event) =>
                        setContacts((prev) => prev.map((item, itemIndex) => (itemIndex === index ? { ...item, email: event.target.value } : item)))
                      }
                      className="w-full rounded-lg border border-black/10 px-4 py-2 text-sm font-normal outline-none focus:border-black/20 focus:ring-2 focus:ring-black/20"
                      placeholder="Введите адрес электронной почты"
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
            onClick={() => {
              if (step === 5 && !validateBanks()) {
                setError('Проверь банковские счета: есть невалидные реквизиты или расхождения с банком по БИК.');
                return;
              }
              setError(null);
              setStep((prev) => Math.min(6, prev + 1));
            }}
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
