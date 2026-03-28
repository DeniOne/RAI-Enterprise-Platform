#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const RESTRICTED_ROOT = process.env.LEGAL_EVIDENCE_ROOT
  ? path.resolve(process.env.LEGAL_EVIDENCE_ROOT)
  : path.resolve(ROOT, "..", "RAI_EP_RESTRICTED_EVIDENCE", "legal-compliance", "2026-03-28");
const DRAFTS_DIR = path.join(RESTRICTED_ROOT, "drafts");
const INDEX_FILE = path.join(DRAFTS_DIR, "INDEX.md");
const PRIORITY_REFERENCES = [
  "ELP-20260328-01",
  "ELP-20260328-02",
  "ELP-20260328-03",
  "ELP-20260328-04",
  "ELP-20260328-05",
  "ELP-20260328-06",
  "ELP-20260328-08",
  "ELP-20260328-09",
];

const PREFILLS = {
  "ELP-20260328-01": {
    title: "Operator Identity And Role Memo",
    linkedDocs: [
      "docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md",
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
    ],
    knownFacts: [
      "Локально подтверждено, что код обрабатывает ПДн и tenant data, но юридическое лицо оператора в репозитории не подтверждено.",
      "По коду подтверждены контуры auth, invitation, telegram, AI/explainability, finance/legal entities и внешние provider-like integrations.",
      "В `COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md` текущий статус по вопросу `Кто является оператором ПДн` зафиксирован как `не подтверждено`.",
    ],
    requiredExternal: [
      "Полное наименование юридического лица-оператора.",
      "ОГРН / ИНН и юридический адрес.",
      "Контактное лицо и канал связи.",
      "Operator / processor split по `prod`, `pilot`, `staging`.",
      "Подпись уполномоченного лица и дата утверждения.",
    ],
    sections: `
## Repo-derived operator context

| Контур | Что подтверждено локально | Чего не хватает |
|---|---|---|
| \`prod\` | код и docs показывают обработку ПДн и tenant data | нет юридического лица, нет signed role memo |
| \`pilot\` | self-host / localized path рассматривается как preferred baseline | нет formal owner decision и contract perimeter |
| \`staging\` | staging как среда упоминается в deployment matrix | нет role split и residency evidence |

## Draft owner prompts

- Указать одно или несколько юрлиц, которые реально выступают оператором/обработчиком.
- Отдельно указать, совпадает ли оператор по \`pilot\` и \`prod\`.
- Зафиксировать, допускается ли delegated processing через external providers и на каком основании.
`,
  },
  "ELP-20260328-02": {
    title: "RKN Notification Evidence Or Exemption Memo",
    linkedDocs: [
      "docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md",
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
    ],
    knownFacts: [
      "В репозитории отсутствует подтверждение notification status в РКН.",
      "В `RF_COMPLIANCE_REVIEW_2026-03-28.md` notification помечен как `вероятно применимо`, но статус остаётся `не подтверждено`.",
      "Текущий legal verdict остаётся `NO-GO` в том числе из-за отсутствия evidence по notification / exemption.",
    ],
    requiredExternal: [
      "Номер и дата уведомления в РКН либо мотивированное memo об exemption.",
      "Юрлицо и контур, к которому относится уведомление.",
      "Дата подачи / актуализации.",
      "Кто подписал и кто владеет поддержанием актуальности.",
    ],
    sections: `
## Repo-derived notification baseline

| Поле | Текущее состояние |
|---|---|
| Notification evidence in repo | не обнаружено |
| Exemption memo in repo | не обнаружено |
| Applied legal status | \`не подтверждено\` |
| Blocking effect | без этого пакета legal verdict не поднимается |

## Draft owner prompts

- Проверить \`pd.rkn.gov.ru\` и внутренний legal archive на наличие действующего уведомления.
- Если уведомления нет, выпустить reasoned exemption memo с привязкой к operator memo.
- Зафиксировать, на какую deployment topology распространяется вывод.
`,
  },
  "ELP-20260328-03": {
    title: "Hosting And Residency Attestation",
    linkedDocs: [
      "docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md",
      "docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md",
    ],
    knownFacts: [
      "Локально подтверждён self-host path для PostgreSQL, Redis и MinIO / S3-compatible WORM.",
      "Production geography, provider, country и region локально не подтверждены.",
      "Для RU-sensitive pilot в docs зафиксирован preferred baseline: self-host / localized path.",
    ],
    requiredExternal: [
      "Provider, country, region и account reference по средам `prod`, `pilot`, `staging`.",
      "Primary DB и object storage residency.",
      "Contract / invoice reference.",
      "Подтверждение первичного хранения ПДн граждан РФ на территории РФ, если это заявляется.",
    ],
    sections: `
## Repo-derived environment matrix

| Среда | Provider | Country | Region | Primary DB | Object storage | Redis / cache | Путь локализации ПДн РФ |
|---|---|---|---|---|---|---|---|
| \`prod\` | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено |
| \`pilot\` | self-host / localized path preferred | требует внешнего подтверждения | требует внешнего подтверждения | PostgreSQL self-host path подтверждён кодом | MinIO / S3-compatible path подтверждён кодом | Redis self-host path подтверждён кодом | требуется formal attestation |
| \`staging\` | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено | не подтверждено |

## Repo-derived supporting facts

- \`.env.example\` и \`docker-compose.yml\` подтверждают локальный контур Postgres / Redis / MinIO.
- \`apps/api/src/level-f/worm/worm-storage.service.ts\` подтверждает WORM storage contour.
- \`HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md\` прямо фиксирует, что actual production geography не подтверждена.
`,
  },
  "ELP-20260328-04": {
    title: "Processor Register And Dpa Pack",
    linkedDocs: [
      "docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md",
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
    ],
    knownFacts: [
      "Кодом подтверждены внешние contours: OpenRouter, Telegram, DaData.",
      "Локально не подтверждены processor contracts, DPA terms, countries обработки и role split.",
      "Hosting / storage контур существует, но production provider и contract perimeter не подтверждены.",
    ],
    requiredExternal: [
      "Contract reference и DPA reference по каждому external provider.",
      "Role split: operator / processor / subprocessor.",
      "Country и purpose обработки.",
      "Ограничения по использованию данных и carve-outs.",
    ],
    sections: `
## Repo-derived processor register

| Provider | Role | Country | Purpose | Data categories | Contract reference | DPA reference |
|---|---|---|---|---|---|---|
| \`OpenRouter\` | требует внешнего подтверждения | не подтверждено | LLM prompts / tool context | возможно PII-adjacent text при ошибочной маршрутизации | не подтверждено | не подтверждено |
| \`Telegram\` | требует внешнего подтверждения | не подтверждено | уведомления / auth links / messaging | Telegram ID, служебные сообщения | не подтверждено | не подтверждено |
| \`DaData\` | требует внешнего подтверждения | не подтверждено | lookup по ИНН и БИК | organization / bank identifiers | не подтверждено | не подтверждено |
| \`Hosting / storage\` | требует внешнего подтверждения | не подтверждено | DB, cache, object storage | tenant/auth/audit data | не подтверждено | не подтверждено |

## Repo-derived supporting facts

- \`openrouter-gateway.service.ts\` подтверждает integration contour с внешним AI provider.
- \`telegram-notification.service.ts\` и telegram runtime подтверждают внешний messaging contour.
- \`dadata.provider.ts\` подтверждает внешний lookup contour.
`,
  },
  "ELP-20260328-05": {
    title: "Transborder Decision Log",
    linkedDocs: [
      "docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md",
      "docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md",
      "docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md",
    ],
    knownFacts: [
      "Local Postgres / Redis / MinIO рассматриваются как preferred baseline для RU-sensitive pilot.",
      "OpenRouter запрещён для контуров с ПДн/чувствительными данными до отдельного decision log.",
      "Telegram и DaData требуют отдельного legal / processor review и не должны считаться автоматически безопасными.",
    ],
    requiredExternal: [
      "Country по каждому external provider.",
      "Data categories и lawful basis.",
      "Allow / deny decision и mitigation.",
      "Owner decision и дата.",
    ],
    sections: `
## Repo-derived decision seed

| Контур | Текущий статус | Предварительное решение | Что нужно подтвердить снаружи |
|---|---|---|---|
| \`Local Postgres / Redis / MinIO\` | self-host path подтверждён | preferred baseline для RU-sensitive pilot | actual country / region / hosting evidence |
| \`OpenRouter\` | внешний AI provider | deny для ПДн/чувствительных данных до отдельного approval | country, DPA, lawful basis, mitigation |
| \`Telegram\` | внешняя платформа | separate legal perimeter, не смешивать с self-host assumptions | country, terms, messaging basis |
| \`DaData\` | внешний lookup provider | review required, не считать автоматически safe | contract role, country, lookup lawful basis |

## Repo-derived owner prompts

- Зафиксировать, есть ли контуры, где OpenRouter вообще допустим.
- Определить, какие категории данных могут идти в Telegram и DaData.
- Привязать решения к operator memo и hosting attestation.
`,
  },
  "ELP-20260328-06": {
    title: "Lawful Basis Matrix And Privacy Notice Pack",
    linkedDocs: [
      "docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md",
      "docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md",
    ],
    knownFacts: [
      "По коду видны продуктовые flows: auth / invitation, telegram notifications, AI / explainability, commerce lookup, finance / contracts.",
      "Единого lawful basis pack и публичных / внутренних privacy notices в репозитории не обнаружено.",
      "Внешние providers и transborder contours требуют отдельной legal decision layer.",
    ],
    requiredExternal: [
      "Lawful basis по каждому ключевому flow.",
      "Нужно ли consent или иное основание.",
      "Источник notice wording: public notice, internal notice, contract wording.",
      "Связь с operator memo и processor / transborder decisions.",
    ],
    sections: `
## Repo-derived lawful basis matrix seed

| Flow | Subjects | Data categories | Purpose | Lawful basis | Consent needed | Notice source |
|---|---|---|---|---|---|---|
| \`auth / front-office\` | сотрудники, внутренние и front-office пользователи | email, phone, Telegram ID, password hash, invitation data | аутентификация, приглашения, доступ | требует внешнего legal подтверждения | требует внешнего legal подтверждения | не подтверждено |
| \`telegram notifications\` | telegram users, операторы, получатели уведомлений | Telegram ID, auth links, service messages | уведомления и auth flows | требует внешнего legal подтверждения | требует внешнего legal подтверждения | не подтверждено |
| \`AI / explainability\` | пользователи AI contour и участники расследований | trace metadata, snippets, incident details | ответы AI, explainability, incident trail | требует внешнего legal подтверждения | требует внешнего legal подтверждения | не подтверждено |
| \`commerce / lookup\` | контрагенты и контакты | ИНН, БИК, organization / bank identifiers | контрагентский lookup | требует внешнего legal подтверждения | требует внешнего legal подтверждения | не подтверждено |
| \`finance / contracts\` | компании, стороны договоров, внутренние пользователи | legal / finance entities и document data | contractual and finance operations | требует внешнего legal подтверждения | требует внешнего legal подтверждения | не подтверждено |

## Repo-derived supporting facts

- \`COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md\` фиксирует \`basis pack\` как \`частично\`.
- \`PRIVACY_DATA_FLOW_MAP_2026-03-28.md\` перечисляет основные flows и residual gaps.
    `,
  },
  "ELP-20260328-07": {
    title: "Subject Rights Operating Evidence",
    linkedDocs: [
      "docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md",
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
    ],
    knownFacts: [
      "В репозитории уже есть отдельный subject-rights / retention runbook с intake checklist, SLA baseline и stop criteria.",
      "Runbook фиксирует `TTA` до 1 рабочего дня, первичный legal triage до 3 рабочих дней и исполнение до 30 календарных дней при отсутствии stop-factor.",
      "Внешний ingress channel, named owner evidence и sample handling artifacts локально не подтверждены.",
    ],
    requiredExternal: [
      "Фактический ingress channel для запросов субъектов.",
      "Named owner и escalation path.",
      "SLA evidence и operational acknowledgement.",
      "Хотя бы один образец обработки запроса или журнал обработки.",
    ],
    sections: `
## Repo-derived subject-rights baseline

| Поле | Что уже есть локально | Что нужно добавить извне |
|---|---|---|
| Intake checklist | описан в runbook | подтвердить фактический канал intake |
| SLA | \`TTA 1 рабочий день\`, \`legal triage 3 рабочих дня\`, \`execution 30 календарных дней\` | подтвердить owner acceptance и operational use |
| Stop criteria | operator unknown, identity mismatch, mandatory retention, WORM hold, unresolved transborder | подтвердить, кто принимает такие решения |
| Result logging | request id, owner, affected systems, итог и правовое основание | приложить sample handling artifacts |

## Repo-derived supporting facts

- \`PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md\` уже задаёт intake checklist, SLA и stop criteria.
- \`COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md\` фиксирует subject rights runbook как \`создан\`, но external SLA / owner evidence как неподтверждённые.
`,
  },
  "ELP-20260328-08": {
    title: "Retention Deletion And Archive Schedule Approval",
    linkedDocs: [
      "docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md",
      "docs/05_OPERATIONS/WORKFLOWS/PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md",
    ],
    knownFacts: [
      "Retention metadata частично подтверждена кодом через `retentionMode`, `retentionUntil` и WORM contour.",
      "Полный approved legal schedule по deletion / archive / legal hold отсутствует.",
      "Subject-rights / retention runbook уже существует, но требует owner-backed schedule.",
    ],
    requiredExternal: [
      "Approved retention matrix по основным data classes.",
      "Deletion triggers и archive rules.",
      "Legal hold и WORM carve-outs.",
      "Owner approval и дата.",
    ],
    sections: `
## Repo-derived retention seed

| Data class | Repo evidence | Retention status | Что нужно утвердить внешне |
|---|---|---|---|
| auth / invitation data | schema и auth services | частично | сроки хранения и deletion trigger |
| audit / WORM artifacts | WORM storage contour | частично | сроки, legal hold, immutable carve-outs |
| AI / trace / incident data | explainability и incidents | частично | retention schedule и archive policy |
| finance / contracts | legal/finance entities в schema | частично | сроки, archive, stop-factors |
| telegram notifications | telegram runtime | частично | message retention и deletion semantics |

## Repo-derived supporting facts

- \`COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md\` фиксирует \`Retention / deletion schedule\` как \`частично\`.
- \`PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md\` уже задаёт operational contour, но не заменяет approved legal schedule.
    `,
  },
  "ELP-20260328-09": {
    title: "First Party Chain Of Title Pack",
    linkedDocs: [
      "docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md",
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
    ],
    knownFacts: [
      "В репозитории есть воспроизводимый OSS inventory, но нет root LICENSE / COPYING файла.",
      "Chain-of-title по first-party IP в репозитории не подтверждён.",
      "В `OSS_LICENSE_AND_IP_REGISTER.md` зафиксированы `33 unknown licenses` и отсутствие root licensing strategy.",
    ],
    requiredExternal: [
      "Employment agreements / IP clauses.",
      "Contractor assignments / IP transfer evidence.",
      "Database rights и право коммерческого использования.",
      "Board / legal sign-off о достаточности пакета.",
    ],
    sections: `
## Repo-derived IP baseline

| Вопрос | Текущее локальное состояние | Что нужно приложить внешне |
|---|---|---|
| Root license strategy | не подтверждена | решение по first-party licensing |
| Chain-of-title по first-party code | не подтверждён | employment / contractor / assignment pack |
| Права на БД | не подтверждены | отдельное evidence по database rights |
| OSS compatibility review | не завершён | legal triage по \`UNKNOWN\` и notice obligations |

## Repo-derived supporting facts

- \`pnpm security:licenses\` построил inventory: \`189 packages\`, \`33 unknown licenses\`.
- \`OSS_LICENSE_AND_IP_REGISTER.md\` прямо фиксирует отсутствие chain-of-title и root license strategy.
- Репозиторий помечен как \`private\`, но это не заменяет legal chain-of-title.
    `,
  },
  "ELP-20260328-10": {
    title: "Oss Unknown License Triage And Notice Pack",
    linkedDocs: [
      "docs/05_OPERATIONS/OSS_LICENSE_AND_IP_REGISTER.md",
      "docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md",
    ],
    knownFacts: [
      "Локально воспроизводимый inventory path уже есть: `pnpm security:licenses`.",
      "Последний baseline показывает `189 packages` и `33 unknown licenses`.",
      "Notice / attribution packet и compatibility review в репозитории не подтверждены.",
    ],
    requiredExternal: [
      "Manual legal triage по всем `UNKNOWN` лицензиям.",
      "Notice obligations register.",
      "Решение по запрещённым или условно совместимым лицензиям.",
      "Owner sign-off о достаточности пакета для дистрибуции и продаж.",
    ],
    sections: `
## Repo-derived OSS triage seed

| Вопрос | Текущее локальное состояние | Что нужно сделать извне |
|---|---|---|
| Машинно-воспроизводимый inventory | есть | использовать как baseline для legal review |
| \`UNKNOWN\` licenses | \`33\` | разобрать вручную |
| Notice / attribution packet | не найден | собрать и утвердить |
| Compatibility review | не завершён | выпустить legal memo |
| Root license strategy | отсутствует | увязать с chain-of-title decision |

## Repo-derived supporting facts

- \`var/security/license-inventory.md\` фиксирует \`Total packages: 189\` и \`Unknown licenses: 33\`.
- \`OSS_LICENSE_AND_IP_REGISTER.md\` прямо говорит, что compatibility review и notice packet отсутствуют.
`,
  },
  "ELP-20260328-11": {
    title: "Crypto Applicability Memo",
    linkedDocs: [
      "docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md",
      "docs/05_OPERATIONS/SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md",
    ],
    knownFacts: [
      "В `RF_COMPLIANCE_REVIEW_2026-03-28.md` crypto applicability помечена как `требует отдельной валидации`.",
      "Код использует JWT, HMAC signatures, crypto services, hashing и Telegram signature verification.",
      "Applicability и licensing contour по ФСТЭК / ФСБ локально не подтверждены.",
    ],
    requiredExternal: [
      "Профильный legal/security memo по применимости регулируемой криптографии.",
      "Периметр систем и сценариев, где используется crypto.",
      "Вывод: нужна ли отдельная regulatory / licensing action.",
      "Owner sign-off и follow-up actions.",
    ],
    sections: `
## Repo-derived crypto contour

| Контур | Repo evidence | Что нужно определить внешне |
|---|---|---|
| JWT secrets и auth | \`apps/api/src/shared/auth/**\` | подпадает ли под отдельные требования |
| Audit HMAC / signatures | \`apps/api/src/shared/audit/audit.service.ts\`, \`audit-notarization.service.ts\` | perimeter и regulatory relevance |
| Telegram signature verification | \`apps/api/src/shared/auth/telegram-auth.service.ts\` | legal treatment внешней подписи |
| Hashing / canonical crypto helpers | \`apps/api/src/shared/crypto/canonical-json.builder.ts\` и related helpers | нужна ли дополнительная классификация |

## Repo-derived supporting facts

- \`SECURITY_BASELINE_AND_ACCESS_REVIEW_POLICY.md\` фиксирует security baseline, но не закрывает crypto applicability.
- \`RF_COMPLIANCE_REVIEW_2026-03-28.md\` прямо требует отдельный профильный review.
`,
  },
};

function getArg(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : "";
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function ensureDir(dirPath, dryRun) {
  if (dryRun) return;
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeText(filePath, content, dryRun) {
  if (dryRun) return;
  fs.writeFileSync(filePath, content);
}

function assert(condition, message) {
  if (!condition) {
    console.error(`[legal-evidence-prefill] ${message}`);
    process.exit(1);
  }
}

function buildDraft(referenceId, generatedAt) {
  const spec = PREFILLS[referenceId];
  assert(spec, `для ${referenceId} нет repo-derived prefill`);
  return `# ${referenceId} Repo-Derived Draft

- reference_id: ${referenceId}
- draft_type: repo-derived working draft
- generated_at: ${generatedAt}
- status: requested
- notice: Этот документ собран только из локальных repo-facts и не является внешним legal evidence. Он не может сам по себе переводить карточку в \`received\`, \`reviewed\` или \`accepted\`.
- linked_docs: ${spec.linkedDocs.join(", ")}

## Цель черновика

Сократить объём ручной подготовки для legal / governance owners: ниже собраны только те факты, которые уже подтверждены кодом и текущими operational docs. Все реквизиты, подписи, contract references и regulator evidence должны быть добавлены владельцами извне.

## Что уже подтверждено локально

${spec.knownFacts.map((fact) => `- ${fact}`).join("\n")}

## Что обязательно нужно добавить извне

${spec.requiredExternal.map((fact) => `- ${fact}`).join("\n")}

${spec.sections.trim()}

## Acceptance reminder

- Этот черновик ускоряет сбор evidence, но не заменяет внешний документ.
- Для реального приёма нужен отдельный файл-источник, который потом заводится через \`pnpm legal:evidence:intake -- --reference=${referenceId} --source=/abs/path/file\`.
- После intake требуются \`reviewed\` и \`accepted\` переходы по runbook.
`;
}

function buildIndex(entries, generatedAt) {
  const lines = [
    "# Restricted Legal Evidence Draft Index",
    "",
    `- generated_at: ${generatedAt}`,
    "- notice: repo-derived drafts ускоряют работу владельцев, но не меняют evidence status.",
    "",
    "| Reference ID | Draft file |",
    "|---|---|",
  ];
  for (const entry of entries) {
    lines.push(`| ${entry.referenceId} | ${entry.filePath} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function printUsage() {
  console.log("usage: node scripts/legal-evidence-prefill.cjs --reference=ELP-20260328-01 | --priority=critical [--dry-run]");
}

function main() {
  const referenceId = getArg("reference");
  const priority = getArg("priority");
  const dryRun = hasFlag("dry-run");
  if (hasFlag("help") || (!referenceId && !priority)) {
    printUsage();
    process.exit(referenceId || priority ? 0 : 1);
  }

  let references = [];
  if (referenceId) {
    references = [referenceId];
  } else if (priority === "critical") {
    references = PRIORITY_REFERENCES;
  } else {
    console.error(`[legal-evidence-prefill] неподдерживаемый priority: ${priority}`);
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const entries = [];
  ensureDir(DRAFTS_DIR, dryRun);

  for (const ref of references) {
    assert(PREFILLS[ref], `неизвестный reference_id: ${ref}`);
    const draftDir = path.join(DRAFTS_DIR, ref);
    const draftFile = path.join(draftDir, `${ref}__repo-derived-draft.md`);
    ensureDir(draftDir, dryRun);
    writeText(draftFile, `${buildDraft(ref, generatedAt)}\n`, dryRun);
    entries.push({
      referenceId: ref,
      filePath: draftFile.replace(/\\/g, "/"),
    });
    console.log(`[legal-evidence-prefill] generated=${draftFile.replace(/\\/g, "/")}`);
  }

  const existingEntries = [];
  if (fs.existsSync(INDEX_FILE)) {
    for (const line of fs.readFileSync(INDEX_FILE, "utf8").split(/\r?\n/)) {
      const match = line.match(/^\| (ELP-[^|]+) \| (.+) \|$/);
      if (!match) continue;
      existingEntries.push({ referenceId: match[1].trim(), filePath: match[2].trim() });
    }
  }

  const merged = new Map(existingEntries.map((entry) => [entry.referenceId, entry]));
  for (const entry of entries) {
    merged.set(entry.referenceId, entry);
  }
  const sortedEntries = [...merged.values()].sort((left, right) =>
    left.referenceId.localeCompare(right.referenceId),
  );
  writeText(INDEX_FILE, buildIndex(sortedEntries, generatedAt), dryRun);
  console.log(`[legal-evidence-prefill] index=${INDEX_FILE.replace(/\\/g, "/")}`);
  console.log(`[legal-evidence-prefill] note=repo-derived drafts do not change evidence status`);
}

main();
