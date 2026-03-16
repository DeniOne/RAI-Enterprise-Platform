import type { FieldErrors } from 'react-hook-form';

import type { PartyFullProfileValues } from './party-schemas';

export type PartyFormTabKey = 'profile' | 'bank' | 'contacts' | 'structure';

export interface PartyValidationTarget {
  tab: PartyFormTabKey;
  tabLabel: string;
  label: string;
  hint: string;
  targetName?: string;
  anchorId: string;
}

export interface PartyValidationIssue extends PartyValidationTarget {
  path: string;
  message: string;
}

const PARTY_TAB_LABELS: Record<PartyFormTabKey, string> = {
  profile: 'Основное и Реквизиты',
  bank: 'Банковские счета',
  contacts: 'Ключевые лица / ЛОПР',
  structure: 'Связанные активы',
};

function getAnchorId(tab: PartyFormTabKey) {
  return `party-tab-${tab}`;
}

function getIndexedLabel(base: string, indexText?: string) {
  const index = Number(indexText ?? '0') + 1;
  return `${base} ${index}`;
}

function buildTarget(
  tab: PartyFormTabKey,
  label: string,
  hint: string,
  targetName?: string,
): PartyValidationTarget {
  return {
    tab,
    tabLabel: PARTY_TAB_LABELS[tab],
    label,
    hint,
    targetName,
    anchorId: getAnchorId(tab),
  };
}

function resolveTargetForPath(path: string): PartyValidationTarget {
  const rules: Array<{
    pattern: RegExp;
    resolve: (match: RegExpMatchArray, rawPath: string) => PartyValidationTarget;
  }> = [
    {
      pattern: /^legalName$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'Полное юридическое наименование', 'Укажи полное название так, как оно указано в официальной регистрации.', rawPath),
    },
    {
      pattern: /^shortName$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'Краткое наименование / бренд', 'Добавь короткое имя компании, которое будет видно в списках и карточках.', rawPath),
    },
    {
      pattern: /^ogrn$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'ОГРН / ОГРНИП', 'Для юрлица укажи ОГРН, для ИП укажи ОГРНИП без лишних символов.', rawPath),
    },
    {
      pattern: /^kpp$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'КПП', 'Укажи КПП в цифровом формате без пробелов.', rawPath),
    },
    {
      pattern: /^inn$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'ИНН', 'Проверь длину ИНН и формат. Поле должно содержать только цифры.', rawPath),
    },
    {
      pattern: /^jurisdictionId$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'Юрисдикция', 'Выбери страну регистрации контрагента.', rawPath),
    },
    {
      pattern: /^type$/,
      resolve: (_, rawPath) =>
        buildTarget('profile', 'Тип контрагента', 'Укажи форму субъекта: юрлицо, ИП или КФХ.', rawPath),
    },
    {
      pattern: /^addresses\.(\d+)\.city$/,
      resolve: (match, rawPath) =>
        buildTarget('profile', `${getIndexedLabel('Адрес', match[1])}: город`, 'Заполни регион или город для этого адреса.', rawPath),
    },
    {
      pattern: /^addresses\.(\d+)\.street$/,
      resolve: (match, rawPath) =>
        buildTarget('profile', `${getIndexedLabel('Адрес', match[1])}: улица`, 'Укажи улицу, дом и при необходимости офис.', rawPath),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.accountName$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: назначение`, 'Добавь понятное название счета, например "Основной расчетный счет".'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.accountNumber$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: номер счета`, 'Проверь 20 цифр расчетного счета и его соответствие БИК банка.'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.bic$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: БИК`, 'БИК банка должен содержать 9 цифр.'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.corrAccount$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: корр. счет`, 'Проверь 20 цифр корреспондентского счета и его соответствие БИК банка.'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.bankName$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: банк`, 'Укажи официальное наименование банка.'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.inn$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: ИНН банка`, 'Проверь ИНН банка и его соответствие найденному банку по БИК.'),
    },
    {
      pattern: /^bankAccounts\.(\d+)\.kpp$/,
      resolve: (match) =>
        buildTarget('bank', `${getIndexedLabel('Счет', match[1])}: КПП банка`, 'Проверь КПП банка и его соответствие найденному банку по БИК.'),
    },
    {
      pattern: /^contacts\.(\d+)\.fullName$/,
      resolve: (match) =>
        buildTarget('contacts', `${getIndexedLabel('Контакт', match[1])}: ФИО`, 'Заполни полное ФИО контактного лица.'),
    },
    {
      pattern: /^contacts\.(\d+)\.position$/,
      resolve: (match) =>
        buildTarget('contacts', `${getIndexedLabel('Контакт', match[1])}: должность`, 'Выбери роль или должность этого контакта.'),
    },
    {
      pattern: /^contacts\.(\d+)\.email$/,
      resolve: (match) =>
        buildTarget('contacts', `${getIndexedLabel('Контакт', match[1])}: email`, 'Укажи email в формате name@company.ru.'),
    },
    {
      pattern: /^relations\.(\d+)\.relatedPartyId$/,
      resolve: (match) =>
        buildTarget('structure', `${getIndexedLabel('Связь', match[1])}: контрагент`, 'Выбери связанного контрагента из списка структуры.'),
    },
    {
      pattern: /^relations\.(\d+)\.validFrom$/,
      resolve: (match) =>
        buildTarget('structure', `${getIndexedLabel('Связь', match[1])}: действует с`, 'Укажи дату начала действия корпоративной связи.'),
    },
    {
      pattern: /^assetRelations\.(\d+)\.assetId$/,
      resolve: (match) =>
        buildTarget('structure', `${getIndexedLabel('Актив', match[1])}: объект`, 'Выбери ферму, поле или объект, который связан с контрагентом.'),
    },
    {
      pattern: /^assetRelations\.(\d+)\.basis$/,
      resolve: (match) =>
        buildTarget('structure', `${getIndexedLabel('Актив', match[1])}: основание`, 'Укажи договор, свидетельство или другой документ-основание.'),
    },
  ];

  for (const rule of rules) {
    const match = path.match(rule.pattern);
    if (match) {
      return rule.resolve(match, path);
    }
  }

  if (path.startsWith('bankAccounts.')) {
    return buildTarget('bank', 'Банковские реквизиты', 'Проверь заполнение полей банковского счета.');
  }
  if (path.startsWith('contacts.')) {
    return buildTarget('contacts', 'Контактное лицо', 'Проверь обязательные поля контакта.');
  }
  if (path.startsWith('relations.') || path.startsWith('assetRelations.')) {
    return buildTarget('structure', 'Связь в структуре', 'Проверь обязательные поля связи или привязки актива.');
  }

  return buildTarget('profile', path, 'Проверь это поле и заполни его в корректном формате.', path);
}

function walkValidationTree(
  node: unknown,
  path: string[],
  collector: PartyValidationIssue[],
  seen: Set<string>,
) {
  if (!node || typeof node !== 'object') {
    return;
  }

  const message = typeof (node as { message?: unknown }).message === 'string'
    ? String((node as { message?: unknown }).message)
    : null;

  if (message && path.length > 0) {
    const rawPath = path.join('.');
    const dedupeKey = `${rawPath}:${message}`;
    if (!seen.has(dedupeKey)) {
      seen.add(dedupeKey);
      collector.push({
        ...resolveTargetForPath(rawPath),
        path: rawPath,
        message,
      });
    }
  }

  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (key === 'message' || key === 'type' || key === 'types' || key === 'ref') {
      continue;
    }
    walkValidationTree(value, [...path, key], collector, seen);
  }
}

export function collectPartyValidationIssues(
  errors: FieldErrors<PartyFullProfileValues> | Record<string, unknown>,
): PartyValidationIssue[] {
  const issues: PartyValidationIssue[] = [];
  walkValidationTree(errors, [], issues, new Set());
  return issues;
}

export function getPartyCompletenessTarget(label: string): PartyValidationTarget | null {
  switch (label) {
    case 'Полное наименование':
      return buildTarget('profile', label, 'Укажи полное название компании из официальной регистрации.', 'legalName');
    case 'Краткое название':
      return buildTarget('profile', label, 'Заполни короткое имя компании для списков и поиска.', 'shortName');
    case 'ИНН':
      return buildTarget('profile', label, 'Проверь ИНН и заполни его цифрами без пробелов.', 'inn');
    case 'КПП':
      return buildTarget('profile', label, 'Укажи КПП в цифровом формате.', 'kpp');
    case 'ОГРН':
      return buildTarget('profile', label, 'Заполни ОГРН или ОГРНИП из регистрационных данных.', 'ogrn');
    case 'Юрисдикция':
      return buildTarget('profile', label, 'Выбери страну регистрации контрагента.', 'jurisdictionId');
    case 'Тип контрагента':
      return buildTarget('profile', label, 'Укажи организационно-правовой тип субъекта.', 'type');
    case 'Адрес регистрации':
      return buildTarget('profile', label, 'Добавь хотя бы один юридический адрес с городом и улицей.');
    case 'Банковские счета':
      return buildTarget('bank', label, 'Добавь банковский счет и проверь номер счета, БИК и наименование банка.');
    case 'Ключевые лица':
      return buildTarget('contacts', label, 'Добавь хотя бы одного ключевого представителя с ФИО и ролью.');
    case 'Связи в структуре':
      return buildTarget('structure', label, 'Свяжи контрагента с холдингом, управляющей компанией или активом.');
    default:
      return null;
  }
}

export { PARTY_TAB_LABELS };
