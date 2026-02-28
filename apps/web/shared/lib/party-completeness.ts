import { PartyFullProfileValues } from './party-schemas';

export interface CompletenessResult {
    score: number;
    total: number;
    percent: number;
    missingLabels: string[];
}

export function calculatePartyCompleteness(data: Partial<PartyFullProfileValues>): CompletenessResult {
    const checks = [
        { label: 'Полное наименование', value: data.legalName, required: true },
        { label: 'Краткое название', value: data.shortName, required: false },
        { label: 'ИНН', value: data.inn, required: true },
        { label: 'КПП', value: data.kpp, required: false },
        { label: 'ОГРН', value: data.ogrn, required: false },
        { label: 'Юрисдикция', value: data.jurisdictionId, required: true },
        { label: 'Тип контрагента', value: data.type, required: true },
        { label: 'Адрес регистрации', value: data.addresses && data.addresses.length > 0, required: true },
        { label: 'Банковские счета', value: data.bankAccounts && data.bankAccounts.length > 0, required: false },
        { label: 'Ключевые лица', value: data.contacts && data.contacts.length > 0, required: false },
        { label: 'Связи в структуре', value: (data.relations && data.relations.length > 0) || (data.assetRelations && data.assetRelations.length > 0), required: false },
    ];

    const score = checks.filter(c => {
        if (typeof c.value === 'boolean') return c.value;
        return c.value && String(c.value).trim().length > 0;
    }).length;

    const total = checks.length;
    const percent = Math.round((score / total) * 100);

    const missingLabels = checks
        .filter(c => {
            if (typeof c.value === 'boolean') return !c.value;
            return !c.value || String(c.value).trim().length === 0;
        })
        .map(c => c.label);

    return {
        score,
        total,
        percent,
        missingLabels
    };
}
