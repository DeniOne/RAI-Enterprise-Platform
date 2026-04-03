const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активно',
  AFFILIATED: 'Связано',
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
  HIGHLY_PROBABLE: 'Высокая вероятность',
  FAIL: 'Не пройдено',
  FOUND: 'Найдено',
  FROZEN: 'Заморожено',
  GENERATED_DRAFT: 'Сгенерированный черновик',
  IDLE: 'В ожидании',
  INFO: 'Информация',
  INITIALIZING: 'Запуск',
  IN_PROGRESS: 'В работе',
  INVITED: 'Приглашён',
  LOCKED: 'Заблокировано',
  NON_PAYER: 'Без НДС',
  NONE: 'Нет',
  MET: 'Подтверждено',
  MANAGEMENT: 'Управление',
  NEW: 'Новое',
  NOT_FOUND: 'Не найдено',
  NOT_SUPPORTED: 'Не поддерживается',
  OK: 'В норме',
  OPEN: 'Открыто',
  OVERRIDE_ANALYSIS: 'Ручная проверка',
  OWNERSHIP: 'Собственность',
  PAID: 'Оплачено',
  PARTIAL: 'Частично подтверждено',
  PARTIALLY_PAID: 'Частично оплачено',
  PASS: 'Пройдено',
  PENDING: 'Ожидает',
  PENDING_APPROVAL: 'Ожидает утверждения',
  PLANNED: 'Запланировано',
  PROJECT: 'Проект',
  PRESSURED: 'Под нагрузкой',
  REJECTED: 'Отклонено',
  RESOLVED: 'Разрешено',
  REVIEW: 'На проверке',
  REVOKED: 'Отозван',
  SATURATED: 'Перегружено',
  STABLE: 'Стабильно',
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

const AI_WIDGET_STATUS_LABELS: Record<string, string> = {
  in_progress: 'в работе',
  open: 'открыто',
  queued: 'в очереди',
  watch: 'наблюдение',
};

const ADVISORY_LEVEL_LABELS: Record<string, string> = {
  HIGH: 'высокий',
  LOW: 'низкий',
  MEDIUM: 'средний',
};

const ADVISORY_TREND_LABELS: Record<string, string> = {
  IMPROVING: 'улучшается',
  STABLE: 'стабильно',
  WORSENING: 'ухудшается',
};

const GOVERNANCE_KEY_LABELS: Record<string, string> = {
  ACTIVE: 'активно',
  AHEAD_OF_STABLE: 'выше стабильной версии',
  APPROVED_FINAL: 'подтверждено финально',
  APPROVED_FIRST: 'подтверждено 1/2',
  APPROVED_FOR_PRODUCTION: 'подтверждено для продакшена',
  BUDGET_TUNING_RECOMMENDED: 'рекомендована настройка бюджета',
  CANARY_ACTIVE: 'канарейка активна',
  CONCURRENCY_TUNING_RECOMMENDED: 'рекомендована настройка параллельности',
  EXPIRED: 'истекло',
  INACTIVE: 'неактивно',
  MATCHES_STABLE: 'совпадает со стабильной версией',
  NONE: 'нет',
  NOMINAL: 'штатно',
  PENDING: 'ожидание',
  PROMOTED: 'продвинуто в продакшен',
  QUARANTINE_RECOMMENDED: 'рекомендован карантин',
  READY_FOR_CANARY: 'готово к канарейке',
  REJECTED: 'отклонено',
  REVIEW_REQUIRED: 'требуется проверка',
  ROLLBACK_RECOMMENDED: 'рекомендован откат',
  ROLLED_BACK_TO_STABLE: 'откат к стабильной версии',
};

const TRUST_LATENCY_PROFILE_LABELS: Record<string, string> = {
  CROSS_CHECK_TRIGGERED: 'селективная перепроверка',
  HAPPY_PATH: 'обычный путь',
  MULTI_SOURCE_READ: 'чтение из нескольких источников',
};

const INGRESS_SOURCE_LABELS: Record<string, string> = {
  clarification_resume: 'возобновление после уточнения',
  explicit_tool_call: 'явный вызов инструмента',
  legacy_contracts: 'наследованный контрактный маршрут',
  semantic_router_primary: 'основной семантический маршрут',
  semantic_router_shadow: 'теневой семантический маршрут',
};

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  AUTONOMY_POLICY: 'Нарушение политики автономии',
  CROSS_TENANT_BREACH: 'Нарушение изоляции контуров',
  OPEN_INCIDENT: 'Открытый инцидент',
  PII_LEAK: 'Утечка персональных данных',
  QUALITY_BS_DRIFT: 'Дрейф качества',
  RUNBOOK_EXECUTED: 'Обработка по регламенту',
};

const COMPLIANCE_STATUS_LABELS: Record<string, string> = {
  Active: 'Активно',
  Breach: 'Нарушение',
  Verified: 'Подтверждено',
};

const CROP_LABELS: Record<string, string> = {
  BARLEY: 'Ячмень',
  CORN: 'Кукуруза',
  RAPESEED: 'Рапс',
  SOYBEAN: 'Соя',
  SUNFLOWER: 'Подсолнечник',
  WHEAT: 'Пшеница',
};

const CROP_FORM_LABELS: Record<string, string> = {
  RAPESEED_SPRING: 'Яровой рапс',
  RAPESEED_WINTER: 'Озимый рапс',
  SPRING_RAPESEED: 'Яровой рапс',
  WINTER_RAPESEED: 'Озимый рапс',
};

const CANONICAL_BRANCH_LABELS: Record<string, string> = {
  spring_rapeseed: 'Яровой рапс',
  winter_rapeseed: 'Озимый рапс',
};

const TECH_MAP_BLOCK_LABELS: Record<string, string> = {
  autumn_growth_regulator: 'Осеннее внесение регулятора роста',
  autumn_rosette_assessment: 'Осенняя оценка розетки',
  boron_foliar: 'Внекорневая подкормка бором',
  field_admission_check: 'Проверка допуска поля',
  harvest_with_rapeseed_header: 'Уборка рапсовой жаткой',
  overwintering_assessment: 'Оценка перезимовки',
  post_sowing_rolling: 'Прикатывание после посева',
  seed_treatment: 'Протравливание семян',
  spring_n_s_application: 'Весеннее внесение азота и серы',
};

const TECH_STAGE_CODE_LABELS: Record<string, string> = {
  '01_PRE_SOWING_ANALYSIS': 'Предпосевной анализ',
  '04_SOWING': 'Посев',
};

const STAGE_KEY_LABELS: Record<string, string> = {
  flowering: 'Цветение',
  harvest: 'Уборка',
  pod_filling_ripening: 'Налив и созревание',
  stem_elongation_budding: 'Стеблевание и бутонизация',
  winter_dormancy: 'Перезимовка',
};

const RESOURCE_UNIT_LABELS: Record<string, string> = {
  g: 'г',
  ha: 'га',
  kg: 'кг',
  l: 'л',
  ml: 'мл',
  pcs: 'шт.',
  piece: 'шт.',
  t: 'т',
  unit: 'ед.',
  units: 'ед.',
};

const SOIL_TYPE_LABELS: Record<string, string> = {
  CHESTNUT: 'Каштановая',
  CHERNOZEM: 'Чернозём',
  CLAY: 'Глинистая',
  GRAY_FOREST: 'Серая лесная',
  LOAM: 'Суглинистая',
  PODZOLIC: 'Подзолистая',
  SANDY: 'Песчаная',
  SODDY: 'Дерновая',
};

const TARGET_METRIC_LABELS: Record<string, string> = {
  YIELD_QPH: 'Урожайность, ц/га',
};

const EVIDENCE_SOURCE_KIND_LABELS: Record<string, string> = {
  artifact: 'Файл подтверждения',
  intermediate_route: 'Промежуточный маршрут',
  unknown: 'Неизвестный источник',
};

const SOURCE_SCHEME_LABELS: Record<string, string> = {
  file: 'Файл',
  http: 'Внешняя ссылка',
  https: 'Защищённая ссылка',
  s3: 'Облачное хранилище',
  telegram: 'Telegram',
};

const FRONT_OFFICE_INTENT_LABELS: Record<string, string> = {
  auto_reply: 'Автоответ',
  clarification_request: 'Запрос уточнения',
  client_message: 'Сообщение клиента',
  consultation: 'Консультация',
  context_update: 'Обновление контекста',
  handoff_receipt: 'Подтверждение передачи',
  manager_reply: 'Ответ менеджера',
  observation: 'Наблюдение',
  system_event: 'Системное сообщение',
};

const FRONT_OFFICE_CLARIFICATION_LABELS: Record<string, string> = {
  LINK_FIELD_OR_TASK: 'Укажите поле или задачу',
  LINK_OBJECT: 'Укажите объект хозяйства',
  LINK_SEASON: 'Укажите сезон',
  SUBJECT_REQUIRED: 'Уточните тему обращения',
};

const FRONT_OFFICE_CHANNEL_LABELS: Record<string, string> = {
  internal: 'Внутренний контур',
  telegram: 'Телеграм',
  web_chat: 'Веб-чат',
};

const FRONT_OFFICE_DIRECTION_LABELS: Record<string, string> = {
  inbound: 'Входящее',
  outbound: 'Исходящее',
};

const TOOL_LABELS: Record<string, string> = {
  compute_deviations: 'Разбор отклонений',
  compute_plan_fact: 'Анализ план/факт',
  create_commerce_contract: 'Создание договора',
  create_contract_obligation: 'Создание обязательства',
  create_counterparty_relation: 'Создание связи с контрагентом',
  create_crm_account: 'Создание карточки клиента',
  create_crm_contact: 'Создание контакта',
  create_crm_obligation: 'Создание обязательства клиента',
  create_front_office_escalation: 'Создание эскалации фронт-офиса',
  create_fulfillment_event: 'Создание события исполнения',
  create_invoice_from_fulfillment: 'Создание счёта по исполнению',
  create_payment: 'Создание платежа',
  delete_crm_contact: 'Удаление контакта',
  delete_crm_interaction: 'Удаление взаимодействия',
  delete_crm_obligation: 'Удаление обязательства клиента',
  emit_alerts: 'Формирование оповещений',
  log_crm_interaction: 'Журналирование взаимодействия',
  model: 'Модель ИИ',
  query_knowledge: 'Поиск в контуре знаний',
  register_counterparty: 'Регистрация контрагента',
  review_account_workspace: 'Проверка рабочей области клиента',
  review_ar_balance: 'Проверка дебиторской задолженности',
  review_commerce_contract: 'Проверка договора',
  router: 'Маршрутизация',
  tech_map_draft: 'Черновик техкарты',
  tools: 'Инструменты',
  update_account_profile: 'Обновление профиля клиента',
  update_crm_contact: 'Обновление контакта',
  update_crm_interaction: 'Обновление взаимодействия',
  update_crm_obligation: 'Обновление обязательства клиента',
};

const PRIORITY_LABELS: Record<string, string> = {
  P0: 'Приоритет 0',
  P1: 'Приоритет 1',
  P2: 'Приоритет 2',
};

const DEVIATION_TYPE_LABELS: Record<string, string> = {
  AGRO: 'Агрономическое',
  ECON: 'Экономическое',
};

const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Администратор',
  AGRONOMIST: 'Агроном',
  CEO: 'Генеральный директор',
  CFO: 'Финансовый директор',
  CLIENT_ADMIN: 'Администратор клиента',
  FIELD_WORKER: 'Полевой сотрудник',
  FOUNDER: 'Основатель',
  FRONT_OFFICE_USER: 'Пользователь фронт-офиса',
  MANAGER: 'Менеджер',
  SYSTEM_ADMIN: 'Системный администратор',
  USER: 'Пользователь',
};

const CONTRACT_TYPE_LABELS: Record<string, string> = {
  AGENCY: 'Агентский договор',
  LEASE: 'Аренда',
  SERVICE: 'Услуги',
  SUPPLY: 'Поставка',
};

const CONTRACT_ROLE_LABELS: Record<string, string> = {
  AGENT: 'Агент',
  BENEFICIARY: 'Выгодоприобретатель',
  BUYER: 'Покупатель',
  LESSEE: 'Арендатор',
  LESSOR: 'Арендодатель',
  PAYER: 'Плательщик',
  PRINCIPAL: 'Принципал',
  SELLER: 'Продавец',
};

const SUPPLY_TYPE_LABELS: Record<string, string> = {
  GOODS: 'Товары',
  LEASE: 'Аренда',
  SERVICE: 'Услуги',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Банковский перевод',
  CARD: 'Карта',
  CASH: 'Наличные',
};

const DECISION_AUTHOR_LABELS: Record<string, string> = {
  AI_AGENT: 'ИИ-агент',
  MANAGER: 'Менеджер',
};

const AGENT_ROLE_LABELS: Record<string, string> = {
  AgronomAgent: 'Агроагент',
  MarketerAgent: 'Маркетинговый агент',
  CrmAgent: 'CRM-агент',
  agronomist: 'Агроном',
  agro: 'Агрономия',
  chief_agronomist: 'Главный агроном',
  contracts_agent: 'Контрактный агент',
  crm_agent: 'CRM-агент',
  data_scientist: 'Аналитик данных',
  economist: 'Экономист',
  front_office_agent: 'Агент фронт-офиса',
  knowledge: 'Контур знаний',
  marketing: 'Маркетинг',
  monitoring: 'Мониторинг',
};

const RUNTIME_LAYER_LABELS: Record<string, string> = {
  L1_reactive: 'Реактивный слой L1',
  L1_REACTIVE: 'Реактивный слой L1',
};

const UI_ENTITY_NAME_LABELS: Record<string, string> = {
  'A-RAI': 'РАИ',
  'DeniOne': 'Оператор',
  'John Deere 8R': 'Трактор серии 8R',
  'Legacy Farmer LLC': 'Наследованное хозяйство',
  'South Field Farm': 'Южное полевое хозяйство',
  'South Field Test Plot': 'Южный тестовый участок',
  'TechMap Demo Farm 2026-03-14': 'Демонстрационное хозяйство техкарты 14.03.2026',
  'dev@local.rai': 'оператор',
  'demo-account-don': 'демо-хозяйство Дон',
  'demo-account-kuban': 'демо-хозяйство Кубань',
  'demo-account-volga': 'демо-хозяйство Волга',
  'demo-field-kuban-1': 'демо-поле Кубань-1',
};

const PARITY_DIFF_CODE_LABELS: Record<string, string> = {
  'stage:flowering': 'Стадия: цветение',
  'stage:pod_filling_ripening': 'Стадия: налив и созревание',
  'stage:stem_elongation_budding': 'Стадия: стеблевание и бутонизация',
  'stage:winter_dormancy': 'Стадия: перезимовка',
  'stage_sequence:harvest': 'Порядок стадий: уборка',
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

export function formatAiWidgetStatusLabel(value?: string | null): string {
  return formatMappedValue(value, AI_WIDGET_STATUS_LABELS);
}

export function formatAdvisoryLevelLabel(value?: string | null): string {
  return formatMappedValue(value, ADVISORY_LEVEL_LABELS);
}

export function formatAdvisoryTrendLabel(value?: string | null): string {
  return formatMappedValue(value, ADVISORY_TREND_LABELS);
}

export function formatGovernanceKeyLabel(value?: string | null): string {
  return formatMappedValue(value, GOVERNANCE_KEY_LABELS);
}

export function formatTrustLatencyProfileLabel(value?: string | null): string {
  return formatMappedValue(value, TRUST_LATENCY_PROFILE_LABELS, 'профиль доверия');
}

export function formatIngressSourceLabel(value?: string | null): string {
  return formatMappedValue(value, INGRESS_SOURCE_LABELS, 'возобновление после уточнения');
}

export function formatIncidentTypeLabel(value?: string | null): string {
  return formatMappedValue(value, INCIDENT_TYPE_LABELS);
}

export function formatComplianceStatusLabel(value?: string | null): string {
  return formatMappedValue(value, COMPLIANCE_STATUS_LABELS);
}

export function formatYesNoLabel(value: boolean, yesLabel = 'Да', noLabel = 'Нет'): string {
  return value ? yesLabel : noLabel;
}

export function formatCropLabel(value?: string | null): string {
  return formatMappedValue(value, CROP_LABELS, 'Культура не указана');
}

export function formatCropFormLabel(value?: string | null): string {
  return formatMappedValue(value, CROP_FORM_LABELS, 'Форма культуры не указана');
}

export function formatCanonicalBranchLabel(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'Ветка не определена';
  }

  return (
    CANONICAL_BRANCH_LABELS[normalized] ??
    CANONICAL_BRANCH_LABELS[normalized.toLowerCase()] ??
    CROP_FORM_LABELS[normalized] ??
    CROP_FORM_LABELS[normalized.toUpperCase()] ??
    'Ветка не определена'
  );
}

export function formatTechMapBlockLabel(value?: string | null): string {
  return formatMappedValue(value, TECH_MAP_BLOCK_LABELS, 'Обязательный этап');
}

export function formatTechStageCodeLabel(value?: string | null): string {
  return formatMappedValue(value, TECH_STAGE_CODE_LABELS, 'Служебный этап');
}

export function formatPriorityLabel(value?: string | null): string {
  return formatMappedValue(value, PRIORITY_LABELS, 'Приоритет');
}

export function formatDeviationTypeLabel(value?: string | null): string {
  return formatMappedValue(value, DEVIATION_TYPE_LABELS, 'Тип отклонения');
}

export function formatUserRoleLabel(value?: string | null): string {
  return formatMappedValue(value, USER_ROLE_LABELS, 'Роль не определена');
}

export function formatContractTypeLabel(value?: string | null): string {
  return formatMappedValue(value, CONTRACT_TYPE_LABELS, 'Тип договора');
}

export function formatContractRoleLabel(value?: string | null): string {
  return formatMappedValue(value, CONTRACT_ROLE_LABELS, 'Роль стороны');
}

export function formatSupplyTypeLabel(value?: string | null): string {
  return formatMappedValue(value, SUPPLY_TYPE_LABELS, 'Тип поставки');
}

export function formatVatPayerStatusLabel(value?: string | null): string {
  return formatMappedValue(value, STATUS_LABELS, 'Статус НДС');
}

export function formatPaymentMethodLabel(value?: string | null): string {
  return formatMappedValue(value, PAYMENT_METHOD_LABELS, 'Способ оплаты');
}

export function formatDecisionAuthorLabel(value?: string | null): string {
  return formatMappedValue(value, DECISION_AUTHOR_LABELS, 'Участник');
}

export function formatAgentRoleLabel(value?: string | null): string {
  return formatMappedValue(value, AGENT_ROLE_LABELS, 'Агент');
}

export function formatRuntimeLayerLabel(value?: string | null): string {
  return formatMappedValue(value, RUNTIME_LAYER_LABELS, 'Слой');
}

export function formatParityDiffCodeLabel(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'Служебный код';
  }

  if (PARITY_DIFF_CODE_LABELS[normalized]) {
    return PARITY_DIFF_CODE_LABELS[normalized];
  }

  if (normalized.startsWith('stage:')) {
    const stageKey = normalized.slice('stage:'.length);
    return STAGE_KEY_LABELS[stageKey]
      ? `Стадия: ${STAGE_KEY_LABELS[stageKey].toLowerCase()}`
      : 'Стадия технологического цикла';
  }

  if (normalized.startsWith('stage_sequence:')) {
    const stageKey = normalized.slice('stage_sequence:'.length);
    return STAGE_KEY_LABELS[stageKey]
      ? `Порядок стадий: ${STAGE_KEY_LABELS[stageKey].toLowerCase()}`
      : 'Порядок стадий';
  }

  return 'Служебный код';
}

export function formatResourceUnitLabel(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'ед.';
  }

  return (
    RESOURCE_UNIT_LABELS[normalized] ??
    RESOURCE_UNIT_LABELS[normalized.toLowerCase()] ??
    RESOURCE_UNIT_LABELS[normalized.toUpperCase()] ??
    'ед.'
  );
}

export function formatSoilTypeLabel(value?: string | null): string {
  return formatMappedValue(value, SOIL_TYPE_LABELS, 'Тип почвы');
}

export function formatTargetMetricLabel(value?: string | null): string {
  return formatMappedValue(value, TARGET_METRIC_LABELS, 'Производственная метрика');
}

export function formatLatencyLabel(value?: number | null): string {
  return value === null || value === undefined ? 'ожидание' : `${value.toFixed(0)} мс`;
}

export function formatEvidenceSourceKindLabel(value?: string | null): string {
  return formatMappedValue(value, EVIDENCE_SOURCE_KIND_LABELS, 'Источник');
}

export function formatSourceSchemeLabel(value?: string | null): string {
  return formatMappedValue(value, SOURCE_SCHEME_LABELS, 'Внешний источник');
}

export function formatFrontOfficeIntentLabel(value?: string | null): string {
  return formatMappedValue(value, FRONT_OFFICE_INTENT_LABELS, 'Обращение');
}

export function formatFrontOfficeClarificationLabel(value?: string | null): string {
  return formatMappedValue(value, FRONT_OFFICE_CLARIFICATION_LABELS, 'Требуется уточнение');
}

export function formatFrontOfficeChannelLabel(value?: string | null): string {
  return formatMappedValue(value, FRONT_OFFICE_CHANNEL_LABELS, 'Канал связи');
}

export function formatFrontOfficeDirectionLabel(value?: string | null): string {
  return formatMappedValue(value, FRONT_OFFICE_DIRECTION_LABELS, 'Сообщение');
}

export function formatFrontOfficeOwnerLabel(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'Ответственный не назначен';
  }

  if (AGENT_ROLE_LABELS[normalized] || AGENT_ROLE_LABELS[normalized.toLowerCase()]) {
    return formatAgentRoleLabel(normalized);
  }

  if (USER_ROLE_LABELS[normalized] || USER_ROLE_LABELS[normalized.toUpperCase()]) {
    return formatUserRoleLabel(normalized);
  }

  if (normalized === 'manual') {
    return 'Ручная обработка';
  }

  return 'Ответственный контур';
}

export function formatToolLabel(value?: string | null): string {
  return formatMappedValue(value, TOOL_LABELS, 'Служебный инструмент');
}

export function formatFrontOfficeText(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'Без текста';
  }

  if (normalized.includes('|')) {
    const segments = normalized
      .split('|')
      .map((item) => item.trim())
      .filter(Boolean);
    const lastSegment = segments.at(-1);
    if (lastSegment) {
      return formatFrontOfficeText(lastSegment);
    }
  }

  return formatUiEntityName(normalized)
    .replaceAll('для Южное полевое хозяйство', 'для хозяйства «Южное полевое хозяйство»')
    .replaceAll('по хозяйству Южное полевое хозяйство', 'по хозяйству «Южное полевое хозяйство»')
    .replaceAll('/commerce/contracts', 'раздел договоров')
    .replaceAll('handoff', 'передачу')
    .replaceAll('chatId', 'идентификатор чата');
}

export function formatTechExplainabilityMessage(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return 'Нет пояснения';
  }

  const exactRules: Array<[RegExp, string]> = [
    [/Отсутствует pH почвы для admission-проверки\./gi, 'Отсутствует показатель pH почвы для проверки допуска.'],
    [/Нет подтверждённого значения rotationYearsSinceRapeseed\./gi, 'Не подтверждён интервал севооборота после рапса.'],
    [/Нет значения S_available для rapeseed admission\./gi, 'Не указано содержание доступной серы для проверки допуска рапса.'],
    [/Нет значения B_available для rapeseed admission\./gi, 'Не указано содержание доступного бора для проверки допуска рапса.'],
    [/Нет SAT_avg для explainable branch selection\./gi, 'Не указана сумма активных температур для объяснимого выбора ветки.'],
    [/Зафиксировать текущее значение TECHMAP_RAPESEED_CANONICAL_MODE и company filter перед изменением\./gi, 'Перед изменением зафиксировать текущий режим и настройки фильтра по компаниям.'],
    [/Включить canonical mode для компании через recommended feature flags\./gi, 'Включить канонический режим для компании через рекомендованные флаги функций.'],
    [/Сгенерировать новую rapeseed TechMap и убедиться, что generationStrategy = canonical_schema\./gi, 'Сгенерировать новую техкарту рапса и убедиться, что стратегия генерации соответствует канонической схеме.'],
    [/Проверить, что rollout incidents не открылись повторно после первой canonical generation\./gi, 'Проверить, что инциденты развёртывания не открылись повторно после первой канонической генерации.'],
    [/Подтвердить, что readiness verdict остаётся PASS после cutover smoke\./gi, 'Подтвердить, что итоговая готовность остаётся положительной после контрольной проверки переключения.'],
    [/Вернуть feature flags в rollback command\./gi, 'Вернуть флаги функций в безопасный режим отката.'],
    [/Повторно сгенерировать smoke TechMap и убедиться, что generationStrategy снова legacy_blueprint или shadow authoritative\./gi, 'Повторно сгенерировать контрольную техкарту и убедиться, что стратегия генерации снова соответствует наследованному или теневому сценарию.'],
    [/Проверить, что новые blocker incidents не появились после rollback\./gi, 'Проверить, что после отката не появились новые блокирующие инциденты.'],
  ];

  for (const [pattern, replacement] of exactRules) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }

  return normalized
    .replaceAll('Legacy blueprint', 'Наследованный шаблон')
    .replaceAll('admission-проверки', 'проверки допуска')
    .replaceAll('company filter', 'фильтр по компаниям')
    .replaceAll('canonical mode', 'канонический режим')
    .replaceAll('recommended feature flags', 'рекомендованные флаги функций')
    .replaceAll('feature flags', 'флаги функций')
    .replaceAll('rollout incidents', 'инциденты развёртывания')
    .replaceAll('canonical generation', 'каноническая генерация')
    .replaceAll('readiness verdict', 'итоговая готовность')
    .replaceAll('cutover smoke', 'контрольная проверка переключения')
    .replaceAll('rollback command', 'сценарий отката')
    .replaceAll('smoke TechMap', 'контрольная техкарта')
    .replaceAll('legacy_blueprint', 'наследованный сценарий')
    .replaceAll('shadow authoritative', 'теневой сценарий')
    .replaceAll('blocker incidents', 'блокирующие инциденты')
    .replaceAll('generationStrategy', 'стратегия генерации')
    .replaceAll('canonical_schema', 'каноническая схема')
    .replaceAll('rapeseed TechMap', 'техкарта рапса')
    .replaceAll('PASS', 'пройдено')
    .replaceAll('explainable branch selection', 'объяснимого выбора ветки')
    .replaceAll('rotationYearsSinceRapeseed', 'интервал севооборота после рапса')
    .replaceAll('S_available', 'доступная сера')
    .replaceAll('B_available', 'доступный бор')
    .replaceAll('SAT_avg', 'сумма активных температур')
    .replaceAll('rapeseed admission', 'проверки допуска рапса');
}

export function formatUiEntityName(value?: string | null): string {
  const normalized = normalizeValue(value);
  if (!normalized) {
    return '—';
  }

  let formatted = normalized;

  if (UI_ENTITY_NAME_LABELS[formatted]) {
    return UI_ENTITY_NAME_LABELS[formatted];
  }

  for (const [source, replacement] of Object.entries(UI_ENTITY_NAME_LABELS)) {
    if (formatted.includes(source)) {
      formatted = formatted.replaceAll(source, replacement);
    }
  }

  if (formatted.startsWith('demo-account-')) {
    const suffix = formatted.slice('demo-account-'.length).replaceAll('-', ' ');
    return `Демо-хозяйство ${suffix}`.replace(/\s+/g, ' ').trim();
  }

  if (formatted.startsWith('demo-field-')) {
    const suffix = formatted.slice('demo-field-'.length).replaceAll('-', ' ');
    return `Демо-поле ${suffix}`.replace(/\s+/g, ' ').trim();
  }

  if (formatted.includes('TechMap')) {
    formatted = formatted.replaceAll('TechMap', 'техкарта');
  }

  return formatted;
}
