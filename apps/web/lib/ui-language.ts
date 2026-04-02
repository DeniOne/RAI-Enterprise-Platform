const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активно',
  ANALYSIS: 'На разборе',
  APPROVED: 'Утверждено',
  ARCHIVE: 'В архиве',
  ARCHIVED: 'В архиве',
  ATTENTION: 'Внимание',
  AVAILABLE: 'Доступно',
  BLOCKED: 'Заблокировано',
  BLOCKER: 'Блокер',
  BREACH: 'Нарушение',
  CHECKING: 'На проверке',
  CLOSED: 'Закрыто',
  COLLECTING: 'Сбор подтверждений',
  COMPLETED: 'Завершено',
  CONFLICTED: 'Есть конфликт',
  CRITICAL: 'Критично',
  DELAYED: 'С задержкой',
  DONE: 'Завершено',
  DRAFT: 'Черновик',
  ERROR: 'Ошибка',
  EXECUTING: 'Исполняется',
  FAIL: 'Не пройдено',
  FOUND: 'Найдено',
  FROZEN: 'Заморожено',
  GENERATED_DRAFT: 'Сгенерированный черновик',
  INFO: 'Информация',
  IN_PROGRESS: 'В работе',
  INVITED: 'Приглашён',
  LOCKED: 'Заблокировано',
  MET: 'Подтверждено',
  NEW: 'Новое',
  NOT_FOUND: 'Не найдено',
  NOT_SUPPORTED: 'Не поддерживается',
  OK: 'В норме',
  OPEN: 'Открыто',
  OVERRIDE_ANALYSIS: 'Ручная проверка',
  PAID: 'Оплачено',
  PARTIAL: 'Частично подтверждено',
  PARTIALLY_PAID: 'Частично оплачено',
  PASS: 'Пройдено',
  PENDING: 'Ожидает',
  PENDING_APPROVAL: 'Ожидает утверждения',
  PLANNED: 'Запланировано',
  PROJECT: 'Проект',
  REJECTED: 'Отклонено',
  RESOLVED: 'Разрешено',
  REVIEW: 'На проверке',
  REVOKED: 'Отозван',
  UNKNOWN: 'Неизвестно',
  UNVERIFIED: 'Не подтверждено',
  VERIFIED: 'Подтверждено',
  WAIT: 'Ожидание',
  WARNING: 'Предупреждение',
  WARN: 'Внимание',
};

const ROLLOUT_MODE_LABELS: Record<string, string> = {
  canonical: 'Канонический',
  legacy: 'Наследованный',
  shadow: 'Теневой',
};

const GENERATION_STRATEGY_LABELS: Record<string, string> = {
  blueprintFallback: 'Резервный шаблон',
  canonical: 'Каноническая схема',
  canonicalSchema: 'Каноническая схема',
  legacy: 'Наследованный шаблон',
  legacyBlueprint: 'Наследованный шаблон',
  shadow: 'Теневой режим',
};

const CHANGE_ORDER_TYPE_LABELS: Record<string, string> = {
  ADD_OP: 'Добавление операции',
  CANCEL_OP: 'Отмена операции',
  CHANGE_INPUT: 'Замена ресурса',
  CHANGE_RATE: 'Изменение нормы',
  SHIFT_DATE: 'Сдвиг срока',
};

const OBSERVATION_TYPE_LABELS: Record<string, string> = {
  CALL_LOG: 'Журнал звонка',
  GEO_WALK: 'Геомаршрут',
  MEASUREMENT: 'Замер',
  PHOTO: 'Фото',
  SOS_SIGNAL: 'Сигнал SOS',
  VOICE_NOTE: 'Голосовая заметка',
};

const OBSERVATION_INTENT_LABELS: Record<string, string> = {
  CALL: 'Звонок',
  CONFIRMATION: 'Подтверждение',
  CONSULTATION: 'Консультация',
  DELAY: 'Задержка',
  INCIDENT: 'Инцидент',
  MONITORING: 'Мониторинг',
};

const EVIDENCE_INTEGRITY_LABELS: Record<string, string> = {
  NO_EVIDENCE: 'Нет подтверждения',
  STRONG_EVIDENCE: 'Достаточное подтверждение',
  WEAK_EVIDENCE: 'Слабое подтверждение',
};

const EVIDENCE_TYPE_LABELS: Record<string, string> = {
  CONTRACT: 'Договор',
  GEO_TRACK: 'Геомаршрут',
  INVOICE: 'Счёт',
  LAB_REPORT: 'Лабораторный отчёт',
  PHOTO: 'Фото',
  SATELLITE_IMAGE: 'Спутниковый снимок',
  VIDEO: 'Видео',
  WEATHER_API_SNAPSHOT: 'Погодный снимок',
};

const RUNBOOK_ACTION_LABELS: Record<string, string> = {
  REQUIRE_HUMAN_REVIEW: 'Передать на ручную проверку',
  ROLLBACK_CHANGE_REQUEST: 'Запросить откат',
};

const ADVISORY_RISK_LABELS: Record<string, string> = {
  high: 'высокий',
  low: 'низкий',
  medium: 'средний',
};

function normalizeValue(value?: string | null): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function humanizeKnownCode(value: string): string | null {
  const upper = value.toUpperCase();
  if (STATUS_LABELS[upper]) {
    return STATUS_LABELS[upper];
  }

  const mappedTokens = upper
    .split(/[_-]+/)
    .map((token) => STATUS_LABELS[token] ?? null);

  if (mappedTokens.length > 0 && mappedTokens.every(Boolean)) {
    return mappedTokens.join(' ');
  }

  return null;
}

function formatMappedValue(
  value: string | null | undefined,
  mapping: Record<string, string>,
  fallback = 'Неизвестно',
): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return '—';
  }

  if (mapping[normalized]) {
    return mapping[normalized];
  }

  if (mapping[normalized.toUpperCase()]) {
    return mapping[normalized.toUpperCase()];
  }

  const humanized = humanizeKnownCode(normalized);
  if (humanized) {
    return humanized;
  }

  return fallback;
}

export function formatStatusLabel(value?: string | null): string {
  return formatMappedValue(value, STATUS_LABELS);
}

export function formatSeverityLabel(value?: string | null): string {
  return formatMappedValue(value, STATUS_LABELS);
}

export function formatOutcomeLabel(value?: string | null): string {
  return formatMappedValue(value, STATUS_LABELS);
}

export function formatRolloutModeLabel(value?: string | null): string {
  return formatMappedValue(value, ROLLOUT_MODE_LABELS);
}

export function formatGenerationStrategyLabel(value?: string | null): string {
  return formatMappedValue(value, GENERATION_STRATEGY_LABELS);
}

export function formatChangeOrderTypeLabel(value?: string | null): string {
  return formatMappedValue(value, CHANGE_ORDER_TYPE_LABELS);
}

export function formatObservationTypeLabel(value?: string | null): string {
  return formatMappedValue(value, OBSERVATION_TYPE_LABELS);
}

export function formatObservationIntentLabel(value?: string | null): string {
  return formatMappedValue(value, OBSERVATION_INTENT_LABELS);
}

export function formatEvidenceIntegrityLabel(value?: string | null): string {
  return formatMappedValue(value, EVIDENCE_INTEGRITY_LABELS);
}

export function formatEvidenceTypeLabel(value?: string | null): string {
  return formatMappedValue(value, EVIDENCE_TYPE_LABELS);
}

export function formatRunbookActionLabel(value?: string | null): string {
  return formatMappedValue(value, RUNBOOK_ACTION_LABELS);
}

export function formatAdvisoryRiskLabel(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return '—';
  }

  return ADVISORY_RISK_LABELS[normalized] ?? ADVISORY_RISK_LABELS[normalized.toLowerCase()] ?? 'Неизвестно';
}

export function formatYesNoLabel(value: boolean, yesLabel = 'Да', noLabel = 'Нет'): string {
  return value ? yesLabel : noLabel;
}
