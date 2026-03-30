---
id: DOC-EXE-RAI-EP-PRIORITY-SYNTHESIS-MASTER-REPORT-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-30
claim_id: CLAIM-EXE-RAI-EP-PRIORITY-SYNTHESIS-MASTER-REPORT-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-03-30
evidence_refs: docs/00_CORE/RAI_EP_DOCUMENT_SYSTEM_MAP.md;docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md;docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md;docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md;docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md;docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md;docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md;docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;docs/_audit/DELTA_VS_BASELINE_2026-03-28.md;docs/10_FRONTEND_MENU_IMPLEMENTATION/00_MASTER_MENU_MAP.md;docs/07_EXECUTION/FULL_PROJECT_WBS.md;docs/07_EXECUTION/WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md;apps/api/src/modules/rai-chat;apps/web/app;apps/web/components/ai-chat;apps/web/app/api/ai-chat/route.ts
---
# RAI_EP PRIORITY SYNTHESIS MASTER REPORT

## CLAIM
id: CLAIM-EXE-RAI-EP-PRIORITY-SYNTHESIS-MASTER-REPORT-20260330
status: asserted
verified_by: manual
last_verified: 2026-03-30

Этот документ является главным управленческим синтезом между каноническим замыслом, audit-пакетом, evidence-матрицей и фактическим runtime-контуром. Он не проводит новый аудит, а переводит уже подтверждённые `intent / evidence / verdict` в жёсткий порядок действий для ближайшего продукта: `Agent Core + Minimal Web Surface`.

## 1. Итоговое управленческое заключение

- Реальное состояние системы: инженерный baseline и архитектурное ядро жизнеспособны; главный стоп-фактор остаётся в `Legal / Compliance`, а не в отсутствии агентной и runtime-основы.
- Ближайшее правильное ядро MVP: управляемый агентный runtime, чат, governed work windows, контур explainability/evidence, `TechMap / execution / deviation / result` loop и ограниченный `self-host / localized` путь pilot-внедрения.
- Главный стратегический вывод: продукт нельзя расширять в ширину; его нужно замыкать как развёртываемое управляемое ядро с жёсткими `legal / AppSec / AI policy / release gate`.
- Главный риск распыления: принять широкий `apps/web` и ширину меню за готовый продукт и начать развивать вторичные контуры раньше закрытия legal, AppSec, HITL и `self-host` packet.

### 1.1. Решающая шкала `Decision rubric`

Каждое действие ниже оценивается по восьми осям:

- стратегическая значимость;
- нужность для MVP;
- критичность для безопасности;
- критичность для права РФ и privacy;
- критичность для `IP / OSS / chain-of-title`;
- критичность для `self-host / deploy`;
- влияние на архитектурную целостность;
- риск отвлечения.

Шкала едина для всего документа:

- `H` — высокий вес;
- `M` — средний вес;
- `L` — низкий вес.

### 1.2. Модель уровней выпуска `Release tier model`

| Tier | Смысл | Текущий вывод |
|---|---|---|
| `Tier 0` | внутренняя контролируемая разработка | подтверждён |
| `Tier 1` | `self-host / localized` MVP pilot | частично достижим после закрытия `Class A` и релевантных `Class B` |
| `Tier 2` | controlled operational pilot | пока заблокирован legal/AppSec/ops evidence |
| `Tier 3` | внешнее production с ПДн граждан РФ | недостижим при текущем `Legal / Compliance = NO-GO` |

### 1.3. Правило параллельности `Parallelism rule`

- Параллельное исполнение допустимо только внутри одного кластера закрытия ядра: legal, AppSec, AI policy, backup/restore, installability.
- `Class C` и `Class D` не считаются прогрессом ядра, если `Class A` и `Class B` не закрыты.
- Задачи на ширину не могут подменять закрытие release-gate.
- MVP не считается готовым, пока не закрыты stop-blockers и не сняты release stop conditions из [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md).

### 1.4. Неизменяемые guardrails `Non-destructive guardrails`

- `code/tests/gates > generated manifests > docs`
- `governed core > UI breadth`
- `policy/HITL/evals > autonomy expansion`
- `self-host/localized readiness > SaaS breadth`
- `TechMap core > secondary domain shells`

## 2. Карта канонических входов

| Документ | Тип | Роль в решении | Вес |
|---|---|---|---|
| [RAI_EP_DOCUMENT_SYSTEM_MAP.md](/root/RAI_EP/docs/00_CORE/RAI_EP_DOCUMENT_SYSTEM_MAP.md) | карта канона | определяет слои знания и правила доверия | критический |
| [RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md](/root/RAI_EP/docs/00_STRATEGY/RAI_EP_SYSTEM_BLUEPRINT_AND_GENERAL_PLAN.md) | замысел | фиксирует, чем система хочет быть и что считать ядром | критический |
| [RAI_EP_TARGET_OPERATING_MODEL.md](/root/RAI_EP/docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md) | замысел | определяет operating model и путь внедрения | высокий |
| [RAI_EP_TARGET_ARCHITECTURE_MAP.md](/root/RAI_EP/docs/01_ARCHITECTURE/RAI_EP_TARGET_ARCHITECTURE_MAP.md) | замысел | разделяет ядро и вторичные оболочки на уровне архитектуры | критический |
| [RAI_EP_EXECUTION_ROADMAP.md](/root/RAI_EP/docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md) | замысел | задаёт логический порядок развития, а не широкий backlog | критический |
| [RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md) | замысел | фиксирует TechMap как центр orchestration | критический |
| [RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md) | замысел и policy | задаёт допустимую форму автономии и `tool/HITL/eval` baseline | критический |
| [RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md) | release-policy | переводит зрелость в release-gate по tiers | критический |
| [ENTERPRISE_DUE_DILIGENCE_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md) | verdict | фиксирует текущие `Security / Legal / Deployment / Product` verdict | критический |
| [ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md) | подтверждение | даёт воспроизводимые факты по gates, security, runtime и legal lifecycle | критический |
| [RF_COMPLIANCE_REVIEW_2026-03-28.md](/root/RAI_EP/docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md) | подтверждение и verdict | показывает, почему legal сейчас `NO-GO` | критический |
| [PRIVACY_DATA_FLOW_MAP_2026-03-28.md](/root/RAI_EP/docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md) | подтверждение | фиксирует privacy boundary и незакрытые legal gaps | высокий |
| [AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md](/root/RAI_EP/docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md) | подтверждение | показывает реальные AI runtime gaps до release-ready состояния | высокий |
| [DELTA_VS_BASELINE_2026-03-28.md](/root/RAI_EP/docs/_audit/DELTA_VS_BASELINE_2026-03-28.md) | подтверждение | показывает, что уже улучшилось и что осталось красным | высокий |
| [00_MASTER_MENU_MAP.md](/root/RAI_EP/docs/10_FRONTEND_MENU_IMPLEMENTATION/00_MASTER_MENU_MAP.md) | supporting-источник | показывает ширину frontend-планирования и риск принять её за MVP-факт | средний |
| [FULL_PROJECT_WBS.md](/root/RAI_EP/docs/07_EXECUTION/FULL_PROJECT_WBS.md) | supporting-источник | полезен как карта ширины, но не как ближайший приоритет | средний |
| [WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md](/root/RAI_EP/docs/07_EXECUTION/WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md) | supporting/runtime-мост | подтверждает, что web-chat не нужно изобретать с нуля | высокий |
| `apps/api/src/modules/rai-chat/**` | фактический runtime | подтверждает, что agent core реально существует в коде | критический |
| `apps/web/app/**`, `apps/web/components/ai-chat/**`, `apps/web/app/api/ai-chat/route.ts` | фактический runtime | подтверждают, что minimal web surface уже частично реализован | критический |
| [REPO_RUNTIME_MAP_2026-03-28.md](/root/RAI_EP/docs/_audit/REPO_RUNTIME_MAP_2026-03-28.md) | дополнительное подтверждение | использовать только для repo-scope и topology; старые красные статусы `api/web` считать superseded более поздним due diligence/evidence matrix | низкий |

## 3. Синтез `intent → evidence → decision`

| Блок | Замысел | Подтверждение | Решение | Целевой tier | Что не делать сейчас |
|---|---|---|---|---|---|
| Product core | Система должна быть управляемым operating core, а не витриной модулей | blueprint, target architecture, due diligence | считать ядром `TechMap + execution loop + governed runtime + explainability/evidence surface`; не считать широкий menu продуктом | `Tier 1` | не разворачивать ширину модулей как будто ядро уже закрыто |
| Agent core | Agent runtime должен быть центром orchestration | `apps/api/src/modules/rai-chat/**`, AI failure scenarios, due diligence | agent core уже есть и должен остаться главным фокусом MVP | `Tier 1` | не добавлять новые роли и новый swarm раньше policy-closeout |
| AI governance | AI должен быть advisory/governed, а не свободно автономным | AI governance policy, AI failure scenarios | до любого серьёзного pilot обязательно закрыть `tool matrix`, `HITL matrix`, `formal safety eval suite` | `Tier 1` | не расширять autonomy, пока policy и eval не замкнуты |
| Minimal web surface | Нужен управляемый web-слой для чата, агентского управления и explainability | `apps/web/app/**`, `components/ai-chat/**`, web-chat feasibility plan | web-surface уже частично существует; его надо сузить до минимального governed contour, а не дорисовывать весь фронт | `Tier 1` | не закрывать весь menu breadth и не полировать вторичные экраны |
| Security / AppSec | Security должен быть release-gate, а не постфактум | due diligence, evidence matrix, `pnpm security:audit:ci`, `pnpm gate:secrets` | baseline есть, но dependency/AppSec debt остаётся стоп-риском до pilot | `Tier 1` | не объявлять продукт готовым к pilot при `37 high / 2 critical` |
| RF legal / privacy | Для ПДн и внешнего запуска нужен полный legal packet и внешние evidence | RF review, privacy map, legal lifecycle tools | legal остаётся главным стопом; без внешних артефактов дальше `Tier 0` честно не идти | `Tier 1` после закрытия | не считать внутренние docs заменой внешним юр.доказательствам |
| IP / OSS / chain-of-title | Нужна защита прав на ПО, know-how и лицензий | due diligence, `OSS_LICENSE_AND_IP_REGISTER`, `security:licenses`, RF review | `IP / OSS` нужно поднять в stop-blocker, а не держать как фон | `Tier 1` | не выходить наружу с `33 unknown licenses` и неоформленной цепочкой прав |
| Deployment / self-host | Реалистичный путь — `self-host / localized`, не `SaaS-first` | release criteria, target architecture, due diligence | ближайший deploy target — `Tier 1 self-host/localized`; именно его надо замыкать | `Tier 1` | не планировать `SaaS / hybrid` как основной путь |
| Release discipline | Релиз должен идти по criteria-driven gates | release criteria, due diligence, delta | release discipline уже описана, но ей не хватает закрытых blockers и свежего ops evidence | `Tier 1` | не считать зелёные unit/integration tests достаточными для релиза |
| Installability / support boundary | `Install / upgrade / support` boundary должен быть формализован до внешнего pilot | due diligence, ops docs | installability — это часть MVP-enablement, а не поздний enterprise-polish | `Tier 1` | не переносить installability на потом |
| Documentation governance | Docs должны направлять исполнение, но не подменять runtime truth | document system map, delta, due diligence | docs governance — сильный контур; его нужно использовать как управленческое оружие, а не как самоуспокоение | `Tier 0` | не усреднять конфликтующие docs и не ставить docs выше gates |

## 4. Что такое ближайший MVP на самом деле

### 4.1. Что входит в ближайший MVP

- governed agent core;
- AI chat;
- governed work windows;
- explainability и evidence surface;
- минимальный `auth/session/thread` path;
- lifecycle Техкарты;
- `execution / deviations / result` loop;
- `self-host / localized` installability для ограниченного pilot;
- минимальный web UI для управления агентами и governed interaction;
- tenant boundary и role/capability discipline, достаточные для безопасного controlled use.

### 4.2. Что обязательно должно быть до запуска

- закрытый legal stop-blocker по критичной восьмёрке внешних evidence;
- dependency/AppSec debt ниже release stop threshold;
- universal `tool-permission matrix`;
- universal `HITL matrix`;
- formal AI safety eval suite;
- backup/restore execution evidence;
- install/upgrade/self-host packet;
- закрытый `IP / OSS / chain-of-title` пакет;
- зафиксированный minimal web-surface без расползания по вторичным экранам.

### 4.3. Что не входит в ближайший MVP

- широкое масштабирование `CRM / front-office` сверх текущего governed ядра;
- полное покрытие frontend menu breadth;
- самостоятельный `control tower` как центр продукта;
- новые agent roles до закрытия policy framework;
- `SaaS-first` и `hybrid-first` rollout;
- новые интеграции без legal/transborder closure;
- Telegram как primary-стратегия вместо governed web surface.

### 4.4. Что вредно делать сейчас

- расширять вторичные доменные оболочки;
- принимать `READY` в menu-map за доказательство MVP-ready состояния;
- наращивать автономию AI до закрытия `tool/HITL/eval` контуров;
- строить продукт в ширину раньше развёртываемого управляемого ядра;
- развивать красивую фронтовую ширину вместо минимальной управляемой поверхности.

## 5. Модель приоритетов

### 5.1. Правило выхода `Exit condition rule`

Для всех `Class A` и `Class B` задач завершение считается только при одновременном выполнении трёх условий:

1. достигнуто конкретное конечное состояние;
2. есть воспроизводимое подтверждение;
3. изменился `verdict`, `gate` или появился новый обязательный артефакт.

### 5.2. Class A — stop-blockers

| Приоритет | Действие | Почему сейчас | Какой риск закрывает | Что будет без этого | Стратегия | MVP | Безопасность | Право РФ | IP/OSS | Self-host | Архитектура | Отвлечение | Условие выхода | Подтверждение выполнения | Ожидаемое изменение verdict/gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `A1` | Принять критичную legal-четвёрку `ELP-01/03/04/06` | это минимальный пакет по оператору, residency, processor и lawful basis | внешний запуск без правовой основы, residency drift, неясная processor-модель | legal останется недостоверным, а MVP не сможет выйти из внутреннего режима | H | H | M | H | H | H | H | L | `ELP-01/03/04/06` в статусе `accepted` | `pnpm legal:evidence:transition`, restricted artifacts, `pnpm gate:legal:evidence` | снимается главный legal-cluster; путь к `Tier 1` становится предметным |
| `A2` | Довести полную legal-восьмёрку `01/02/03/04/05/06/08/09` до `accepted` | именно эта восьмёрка держит machine verdict в `NO-GO` | запрет на controlled pilot с ПДн и слабая `IP`-защита | `Legal / Compliance` останется `NO-GO` | H | H | M | H | H | H | M | L | приоритетная восьмёрка `accepted` и `reviewed` | `pnpm legal:evidence:verdict`, `external-legal-evidence-verdict.md` | `Legal / Compliance: NO-GO -> CONDITIONAL GO` |
| `A3` | Опустить dependency/AppSec debt ниже release stop threshold | security уже измерим, но всё ещё красный для релиза | эксплуатация уязвимостей, слабый release approval | pilot останется условным и спорным | H | H | H | M | M | H | M | L | критичный и высокий AppSec debt опущен до допустимого порога release policy | `pnpm security:audit:ci`, security summary, release review | Security blocker перестаёт быть release stop condition |
| `A4` | Ввести universal `tool-permission matrix` | AI governance policy требует явного разрешительного контура | misuse инструментов, unsafe write paths, privilege bleed | agent core останется небезопасным для pilot | H | H | H | M | M | M | H | L | существует каноническая matrix по `tool/action/role/risk` | policy doc, runtime integration, relevant tests/gates | AI governance становится пригодным к релизу по доступу к инструментам |
| `A5` | Ввести universal `HITL matrix` для high-impact flows | high-impact AI без HITL запрещён release criteria | unsafe autonomy, необратимые действия, governance gap | controlled pilot останется формально заблокирован | H | H | H | H | M | M | H | L | high-impact flows размечены и привязаны к human checkpoint | policy matrix, runtime checks, evidence in docs/tests | снимается stop condition `high-impact AI flows not covered by HITL` |
| `A6` | Собрать formal AI safety eval suite | AI failure scenarios прямо указывают его отсутствие | release без проверяемой safety discipline | AI останется advisory только на словах | H | H | H | M | M | M | H | L | есть formal suite с результатами для релизной волны | eval corpus, test/gate output, release artifact | AI release gate становится воспроизводимым |
| `A7` | Провести `backup/restore` drill и выпустить свежее подтверждение | release criteria требуют не только runbook, но и execution evidence | невосстановимость после инцидента, `self-host/ops` failure | `Tier 1` и `Tier 2` останутся заблокированными | H | H | M | M | L | H | M | L | выполнен drill с подтверждённым `restore-path` | runbook execution report, ops evidence | снимается stop condition по `backup/restore evidence` |
| `A8` | Довести install/upgrade/self-host packet до воспроизводимого состояния | ближайший целевой tier — именно `self-host / localized` | невозможно честно внедрять, обновлять и поддерживать MVP | MVP будет существовать только как dev-сборка | H | H | M | H | M | H | H | L | полный install/upgrade/support boundary существует и проверен | install packet, deployment docs, verification evidence | `Tier 1` становится достижимым не только теоретически |
| `A9` | Закрыть `IP / OSS / chain-of-title` пакет | права на ПО и лицензии стоят выше продуктовой ширины | потеря прав, лицензионный риск, слабая защита know-how | legal/IP контур останется уязвим даже после privacy closeout | H | M | M | H | H | M | H | L | закрыты `33 unknown licenses` и есть принятая chain-of-title evidence | `pnpm security:licenses`, `OSS_LICENSE_AND_IP_REGISTER`, external legal evidence | IP-блокер перестаёт удерживать legal/deployment verdict |

### 5.3. Class B — MVP enablers

| Приоритет | Действие | Почему сейчас | Какой риск закрывает | Что будет без этого | Стратегия | MVP | Безопасность | Право РФ | IP/OSS | Self-host | Архитектура | Отвлечение | Условие выхода | Подтверждение выполнения | Ожидаемое изменение verdict/gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `B1` | Замкнуть TechMap lifecycle как центр orchestration | TechMap заявлен как главный operating core | продукт расползётся в набор экранов и агентных фич | MVP потеряет предметное ядро | H | H | M | M | M | M | H | L | lifecycle `create -> review -> approve -> publish -> execute -> revise` описан и подтверждён как единый core path | canonical docs + runtime adoption evidence | product core перестаёт быть концептом и становится проверяемым |
| `B2` | Закрепить `execution / deviations / result` loop | без этого agent core не доводит решение до управляемого результата | chat останется красивой прослойкой без управленческого смысла | MVP станет демонстрацией, а не рабочей системой | H | H | M | M | L | M | H | L | loop работает как связанный сценарий, а не набор разрозненных экранов | runtime routes, tests, execution docs | MVP становится осмысленным управленческим контуром |
| `B3` | Сузить web-surface до `agent/chat/governance core` | фронт уже широк, но это отвлекает от ядра | ширина UI вытеснит governed runtime из приоритета | команда будет "делать фронт", а не продукт | H | H | M | M | L | M | H | H | зафиксирован минимальный `web-scope` и убран статус фронта как ложный proxy готовности | synthesis doc, nav decisions, implementation slices | frontend перестаёт диктовать roadmap сверху вниз |
| `B4` | Довести `web delivery / auth / session / thread` path | web-chat не нужно строить заново, но нужно довести до надёжного канала | governed interaction останется непрочным | minimal web-surface не сможет быть реальным `pilot-entrypoint` | H | H | M | M | L | H | M | L | поток `login -> thread -> message -> read/reply -> governance feedback` стабилен | runtime pages/API/tests | web-surface становится практическим MVP-входом |
| `B5` | Закрепить минимальный `role/capability/tenant` contour | multi-tenant integrity и governed access уже сильны, их нельзя размывать | tenant bleed, role confusion, unsafe visibility | даже хороший core будет трудно использовать безопасно | H | H | H | H | M | H | H | L | минимальный `role/capability` contour описан и подтверждён runtime checks | tenant/context gates, runtime tests, policy docs | MVP становится пригодным для controlled use без role-chaos |

### 5.4. Class C — stability / hardening

| Приоритет | Действие | Почему сейчас | Какой риск закрывает | Что будет без этого | Стратегия | MVP | Безопасность | Право РФ | IP/OSS | Self-host | Архитектура | Отвлечение | Условие выхода | Подтверждение выполнения | Ожидаемое изменение verdict/gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `C1` | Получить внешнее подтверждение по `branch protection` и `access settings` | локально это не подтверждается | слабый governance-perimeter вокруг релиза | `Tier 2+` останется недоказанным | M | M | H | M | M | M | M | L | есть внешнее подтверждение настроек доступа и protection | external settings evidence, access review artifacts | release-governance перестаёт быть `не подтверждено` |
| `C2` | Закрыть historical key rotation debt и workspace secret hygiene | tracked secret debt снят, historical долг остался | повторное использование старых ключей, локальный leakage risk | security baseline останется условным | M | M | H | M | M | M | M | L | ротация и закрытие historical incident подтверждены | incident follow-up evidence, secret hygiene report | security residual risk снижается до управляемого |
| `C3` | Довести monitoring/incident/rollback/support model | для controlled operational pilot нужен ops contour | инциденты будут разбираться вручную и медленно | `Tier 2` не станет честным operational pilot | M | M | M | M | L | H | M | L | есть подтверждённый support/incident/rollback contour | ops docs, drills, evidence | появляется путь к `Tier 2` |
| `C4` | Добавить selective operational reporting только после ядра | отчётность нужна, но не как driver roadmap | premature dashboarding и control-tower drift | внимание уйдёт в витрины | M | L | L | L | L | M | M | M | reporting привязан к уже закрытому ядру и release needs | targeted reports tied to operations | hardening усиливает ядро, а не заменяет его |

### 5.5. Class D — later / do not do now

| Приоритет | Действие | Почему сейчас не надо | Какой риск создаёт | Что будет без этого прямо сейчас | Стратегия | MVP | Безопасность | Право РФ | IP/OSS | Self-host | Архитектура | Отвлечение | Условие возврата | Подтверждение выполнения | Ожидаемое изменение verdict/gate |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `D1` | Полное закрытие menu breadth | фронт уже шире нужного MVP | подмена продукта навигационной шириной | ничего критичного не ломается | L | L | L | L | L | L | M | H | возврат после `Tier 1` core closeout | synthesis doc + frontend docs | verdict не меняется, меняется только breadth |
| `D2` | Широкое масштабирование `CRM / front-office` сверх текущего ядра | это надстройка над ядром, а не ближайший core; существующие важные `front-office / CRM` контуры уже входят в текущий perimeter | рост ширины и compliance burden | MVP не страдает | M | L | M | M | M | M | M | H | после `Tier 1` и закрытого legal base | runtime/audit evidence | verdict не меняется до закрытия core |
| `D3` | Новые agent roles | текущий runtime уже достаточно сложен | policy gap, autonomy sprawl | ядро остаётся работоспособным | M | L | M | M | L | L | H | H | после `tool/HITL/eval` framework | AI governance docs and evals | без закрытия policy verdict не улучшается |
| `D4` | Расширение автономии AI | прямо конфликтует с AI policy и release criteria | unsafe autonomy | advisory-first ядро остаётся валидным | L | L | H | H | M | M | H | H | только после formal policy/eval/hitl closure | AI policy + eval evidence | иначе ухудшает AI verdict |
| `D5` | `SaaS-first` / `hybrid-first` ambitions | противоречат текущему realistic deployment path | ложные предпосылки по infra/legal/support | self-host MVP можно делать без этого | L | L | M | H | M | H | M | H | после доказанного `Tier 1` и `Tier 2` | release criteria + ops evidence | до этого не даёт честного прогресса |
| `D6` | Новые внешние интеграции | каждая интеграция увеличивает legal/transborder surface | residency/privacy drift и integration sprawl | core MVP не зависит от новых интеграций | L | L | M | H | M | M | M | H | после legal/transborder closure | RF review + hosting matrix | раньше ухудшает legal profile |
| `D7` | `Control tower` как первичный продукт | это полезный усилитель, но не ядро MVP | витринность вместо core execution | ядро работает и без этого | M | L | L | L | L | M | M | H | после закрытия core loop и ops hardening | target architecture + due diligence | не влияет на ближайший verdict |
| `D8` | Полный `settings/admin` shell | административная ширина не равна governed MVP | отвлечение разработки в вспомогательные экраны | pilot не блокируется | L | L | L | M | M | M | M | H | после `Tier 1` closeout | frontend menu docs + runtime reality | verdict не меняется |

## 6. Что уже хорошо и нельзя ломать

| Контур | Почему ценен | Чем подтверждён | Что нельзя делать |
|---|---|---|---|
| Зелёный `build/test/gates` baseline | это реальный engineering floor, ниже которого нельзя падать | due diligence, evidence matrix | нельзя подменять регрессии красивым roadmap и новыми фичами |
| Invariant/schema/tenant/raw-sql discipline | держит integrity ядра и снижает скрытую деградацию | `pnpm gate:invariants`, `pnpm gate:db:*`, delta | нельзя вносить ad hoc bypass и unsafe tooling-paths |
| Существующий `rai-chat` runtime | это уже рабочий agent core, а не идея на бумаге | `apps/api/src/modules/rai-chat/**` | нельзя превращать его в витрину без governance или распиливать на хаотичные новых агентов |
| Work-window и AI chat surface | это уже минимальная управляемая web-поверхность | `apps/web/components/ai-chat/**`, runtime routes, tests | нельзя жертвовать ей ради полного menu completion |
| Channel-agnostic web-chat foundation | убирает зависимость от одного внешнего канала | web-chat feasibility doc, `apps/web`, front-office thread client | нельзя снова мыслить канал как Telegram-first imperative |
| Legal evidence automation contour | превращает legal closeout в управляемый queue, а не в хаос | legal lifecycle scripts, ops docs, evidence matrix | нельзя выдавать внутреннюю автоматизацию за закрытый legal verdict |
| Self-host/localized-first release logic | это честный и реалистичный путь к MVP pilot | target architecture, release criteria, due diligence | нельзя подменять его `SaaS-first` фантазией |
| Docs-as-code governance | позволяет принимать решения не по памяти, а по связным артефактам | document system map, docs lint, delta | нельзя усреднять конфликтующие документы и нельзя поднимать docs выше code/tests/gates |

## 7. Anti-roadmap

| Направление | Почему нельзя сейчас | Когда возвращаться |
|---|---|---|
| Расширение фронта ради ширины | создаёт ложный вид прогресса и съедает capacity ядра | после закрытия `Class A` и `Class B` |
| Полное menu completion | не даёт release-tier сдвига и не снимает стоп-блокеры | после `Tier 1` |
| Широкое масштабирование `CRM / front-office` сверх текущего ядра | повышает legal/privacy surface раньше закрытия базовых gate | после legal-closeout и стабилизированного core |
| Новые агенты без universal policy framework | усиливают autonomy и routing noise | после `tool/HITL/eval` closure |
| `SaaS / hybrid` ambitions | конфликтуют с честным current deployment path | после доказанного `self-host` и controlled operational pilot |
| Интеграции без legal/transborder discipline | расширяют blast radius и compliance debt | после legal/transborder closure |
| Автономия AI выше текущего governed threshold | нарушает AI policy и release criteria | только после formal AI governance closeout |
| Secondary domain shells раньше TechMap core closure | разрушают архитектурный центр тяжести | после замыкания TechMap/execution/result loop |
| `Control tower` как первичный продукт | витрина не заменяет core execution system | после `Tier 1` и части `Tier 2` hardening |
| Полный `settings/admin` contour | административная ширина не приближает MVP | после выхода из stop-blocker режима |

## 8. Legal / RF / IP / deployment decision layer

### 8.1. Управленческая таблица решений

| Ось | Текущее состояние | Что блокирует | Что обязательно сделать | Тип усилия | Минимальный tier |
|---|---|---|---|---|---|
| Operator identity и роли | не подтверждено внешним evidence | нет принятых артефактов по оператору | принять `ELP-01` | external evidence + legal validation | `Tier 1` |
| РКН notification status | не подтверждено | нельзя честно работать с ПДн в pilot-режиме | принять `ELP-02` | external evidence + legal validation | `Tier 1` |
| Hosting/residency/localization | частично описано, не подтверждено внешне | нет доказанного localized perimeter | принять `ELP-03` и связать с self-host packet | external evidence + technical | `Tier 1` |
| Processor/DPA register | не подтверждён | неясен perimeter внешней обработки | принять `ELP-04` | external evidence + legal validation | `Tier 1` |
| Transborder decisions | описаны как gap | любой внешний AI/integration path остаётся спорным | принять `ELP-05` | legal validation + external evidence | `Tier 2`, частично `Tier 1` при внешних провайдерах |
| Lawful basis / notices | частично описаны | нет закрытого privacy base | принять `ELP-06` | legal validation + organizational | `Tier 1` |
| Retention/deletion/archive | runbook есть, внешней опоры не хватает | lifecycle ПДн не закрыт до audit-grade уровня | принять `ELP-08` | organizational + legal validation | `Tier 1` |
| Chain-of-title / IP | красный юридический и коммерческий риск | права на ПО и БД не закрыты decision-grade evidence | принять `ELP-09` и закрыть unknown licenses | external evidence + IP/legal + technical | `Tier 1` |
| Backup/restore/DR | runbook есть, свежего execution evidence нет | self-host и ops readiness остаются условными | выполнить drill и выпустить report | technical + organizational | `Tier 1` |
| Installability/support boundary | частично описано | pilot нельзя честно передавать и поддерживать | собрать install/upgrade/support packet | technical + organizational | `Tier 1` |
| Access governance / branch protection | локально не подтверждено | нет полного release governance evidence | получить внешнее подтверждение | organizational + external evidence | `Tier 2` |
| AI high-impact governance | policy есть, runtime closure неполный | нет `tool/HITL/eval` полного набора | закрыть `A4/A5/A6` | technical + policy | `Tier 1` |

### 8.2. Что обязательно до `Tier 1`

- legal-восьмёрка в нужном объёме должна перестать держать verdict в `NO-GO`;
- dependency/AppSec debt должен опуститься ниже release stop threshold;
- должны существовать `tool-permission matrix`, `HITL matrix`, `formal AI safety eval suite`;
- нужен подтверждённый backup/restore drill;
- нужен install/upgrade/self-host packet;
- нужен минимальный web-surface для governed interaction, а не только development-shell.

### 8.3. Что обязательно до `Tier 2`

- внешнее подтверждение `branch protection / access governance`;
- monitoring, incident, rollback и support boundary;
- закрытый transborder decision pack для реально используемых внешних провайдеров;
- operational evidence, а не только runbooks.

### 8.4. Что обязательно до `Tier 3`

- legal/compliance должен уйти из `NO-GO`;
- должна быть доказана полная workability с ПДн граждан РФ;
- должна быть закрыта IP-chain, license debt и residency perimeter;
- AI high-impact governance должен быть release-ready, а не "почти готов".

### 8.5. Что обязательно ещё до работы с ПДн

- operator identity;
- lawful basis;
- notification status;
- residency/localization;
- processor perimeter;
- retention/deletion discipline.

### 8.6. Что обязательно до `self-host / on-prem`

- install/upgrade packet;
- backup/restore evidence;
- support boundary;
- deployment topology и data boundary rules.

### 8.7. Что обязательно для защиты ПО и IP

- закрытая chain-of-title;
- устранённые `unknown licenses`;
- разделение tracked/workspace secrets;
- historical key rotation closeout;
- формализованное владение know-how и внешними processor-contracts.

## 9. Итоговая последовательность действий

1. Сначала закрыть `Class A` как единый stop-blocker слой: legal evidence, AppSec debt, `tool/HITL/eval`, backup/restore, self-host packet, `IP / OSS / chain-of-title`.
Эффект: система выходит из режима "ядро есть, но выпускать рано" в режим честного `Tier 1` closeout.

2. Затем замкнуть `Class B`: TechMap lifecycle, `execution / deviations / result` loop, minimal web surface, web delivery/auth/session/thread path, role/capability/tenant contour.
Эффект: MVP перестаёт быть набором заделов и становится рабочим governed product core.

3. Потом пройти `Class C`: access governance evidence, historical key rotation closeout, monitoring/incident/rollback/support model, selective operational reporting.
Эффект: controlled pilot превращается в operationally defendable contour.

4. Только после этого возвращаться к selective breadth, если она усиливает уже закрытый core, а не маскирует его незавершённость.
Эффект: вторичные контуры растут поверх стабильной платформы, а не вместо неё.

5. Позже поднимать secondary domain shells, новые агентные роли, внешние интеграции и более широкие продуктовые оболочки.
Эффект: система масштабируется через шаблоны и policy, а не через ad hoc-ширину.

6. Не делать сейчас ничего, что нарушает guardrails: широкий фронт, SaaS-first ambitions, autonomy expansion, интеграционный рост и menu completion как замену ядру.
Эффект: приоритеты не размываются красивыми, но опасными вторичностями.

## 10. Итоговый управленческий verdict

### 10.1. Какой реальный порядок развития системы

Реальный порядок такой: сначала `legal / AppSec / AI-policy / release` closeout, затем core MVP loop, потом operational hardening, и только потом ширина. Любая иная последовательность будет имитировать прогресс и ухудшать управляемость.

### 10.2. Что является ближайшим правильным ядром продукта

Ближайшее правильное ядро продукта — это не широкий `web SaaS`, а `TechMap-centered governed agent platform` с минимальной web-поверхностью для чата, агентского управления, explainability и controlled execution.

### 10.3. Что сейчас отвлекает и опасно

Сейчас отвлекают и опасны: ширина фронта, широкое масштабирование `CRM / front-office` сверх текущего ядра, новые агентные роли сверх уже существующего важного состава, избыточная автономия AI, `SaaS / hybrid` ambitions, новые интеграции и `control tower` как псевдоцентр продукта. Всё это может быть полезно позже, но сейчас ломает порядок.

### 10.4. Десять действий наивысшего приоритета

| № | Действие | Стратегия | MVP | Безопасность | Право РФ | IP/OSS | Self-host | Архитектура | Условие выхода | Изменение verdict/gate |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Принять `ELP-01/03/04/06` | H | H | M | H | H | H | H | четыре критичных legal артефакта `accepted` | снимается главный legal cluster |
| 2 | Довести legal-восьмёрку до `accepted` | H | H | M | H | H | H | M | `pnpm legal:evidence:verdict` больше не держит `NO-GO` | `Legal / Compliance -> CONDITIONAL GO` |
| 3 | Снизить dependency/AppSec debt | H | H | H | M | M | H | M | security threshold опущен до релизного порога | security stop condition снят |
| 4 | Ввести universal `tool-permission matrix` | H | H | H | M | M | M | H | matrix существует и привязана к runtime | AI governance усиливается до release-usable |
| 5 | Ввести universal `HITL matrix` | H | H | H | H | M | M | H | high-impact flows закрыты human checkpoints | снимается AI stop condition по HITL |
| 6 | Собрать formal AI safety eval suite | H | H | H | M | M | M | H | suite существует и даёт релизный вывод | AI release gate становится проверяемым |
| 7 | Провести backup/restore drill | H | H | M | M | L | H | M | есть drill report и restore evidence | снимается ops stop condition |
| 8 | Довести install/upgrade/self-host packet | H | H | M | H | M | H | H | install path воспроизводим и проверен | `Tier 1` становится честно достижимым |
| 9 | Закрыть `IP / OSS / chain-of-title` пакет | H | M | M | H | H | M | H | unknown licenses устранены, rights chain доказана | legal/IP residual снижается |
| 10 | Замкнуть `TechMap + execution + minimal web` MVP loop | H | H | M | M | L | H | H | core сценарий работает как единая система | MVP становится продуктом, а не набором заделов |

### 10.5. Десять вещей, которые нельзя делать до закрытия блокеров

| № | Что не делать | Почему опасно | Какой guardrail нарушает | Когда возвращаться |
|---|---|---|---|---|
| 1 | Закрывать весь frontend menu breadth | имитирует прогресс вместо ядра | `governed core > UI breadth` | после `Tier 1` |
| 2 | Широко масштабировать `CRM / front-office` сверх текущего ядра | расширяет legal/privacy surface без необходимости; существующий важный контур при этом сохраняется | `TechMap core > secondary domain shells` | после core closeout |
| 3 | Добавлять новых агентов | раздувает policy debt | `policy/HITL/evals > autonomy expansion` | после `tool/HITL/eval` closure |
| 4 | Поднимать автономию AI | создаёт release-неприемлемый риск | `policy/HITL/evals > autonomy expansion` | после formal AI governance closure |
| 5 | Планировать `SaaS / hybrid` как ближайший путь | подменяет реальный deploy target | `self-host/localized readiness > SaaS breadth` | после `Tier 1` и `Tier 2` |
| 6 | Добавлять новые интеграции | увеличивает transborder и processor risk | `code/tests/gates > manifests > docs` и legal guardrails | после legal/transborder closeout |
| 7 | Делать `control tower` первичным продуктом | витрина вытесняет execution core | `TechMap core > secondary domain shells` | после operational hardening |
| 8 | Строить полный `settings/admin` shell | отвлекает на неядровые экраны | `governed core > UI breadth` | после controlled pilot readiness |
| 9 | Считать menu `READY` доказательством MVP | создаёт ложную управленческую картину | `code/tests/gates > manifests > docs` | никогда; menu всегда вторичен к runtime evidence |
| 10 | Усреднять конфликтующие docs и игнорировать поздний verdict | разрушает дисциплину принятия решений | `code/tests/gates > manifests > docs` | никогда; конфликт надо явно фиксировать и разрешать |
