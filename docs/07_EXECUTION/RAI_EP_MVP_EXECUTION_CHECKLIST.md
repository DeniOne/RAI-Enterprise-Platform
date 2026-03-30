---
id: DOC-EXE-RAI-EP-MVP-EXECUTION-CHECKLIST-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-30
claim_id: CLAIM-EXE-RAI-EP-MVP-EXECUTION-CHECKLIST-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-03-30
evidence_refs: docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# RAI_EP MVP EXECUTION CHECKLIST

## CLAIM
id: CLAIM-EXE-RAI-EP-MVP-EXECUTION-CHECKLIST-20260330
status: asserted
verified_by: manual
last_verified: 2026-03-30

Этот документ переводит synthesis-отчёт и audit-пакет в простой порядок действий для owner-уровня. Его цель — не описать весь проект, а дать понятный чеклист: что делать дальше, в каком порядке и что считать реальным прогрессом.

## 1. Что мы строим сейчас

Сейчас правильная цель проекта — не большой широкий продукт и не полный `SaaS`.

Ближайшая правильная цель:

- управляемое агентное ядро;
- чат;
- минимальный `web`-интерфейс для работы с агентами;
- контур explainability и evidence;
- жизненный цикл Техкарты;
- ограниченный `self-host / localized` MVP-pilot.

Главная мысль:

- сначала закрываем стоп-блокеры;
- потом доводим ядро MVP до рабочего состояния;
- только потом расширяем продукт в ширину.

## 2. Что нельзя путать с прогрессом

Следующие вещи выглядят как движение вперёд, но сейчас не являются главным прогрессом:

- расширение меню и экранов;
- широкое масштабирование `CRM / front-office` сверх текущего рабочего ядра;
- новые агентные роли сверх уже существующего важного состава;
- рост автономии AI;
- новые интеграции;
- движение в сторону `SaaS / hybrid` раньше `self-host`-ядра.

Если делать это раньше времени, проект будет казаться больше, но не станет ближе к правильному запуску.

Важно:

- существующие `front-office` и `CRM`-агенты уже входят в важный текущий контур;
- здесь под запретом не они сами, а их преждевременное разрастание в ширину;
- если они нужны для governed interaction, agent handoff, чата и рабочего цикла, это часть MVP, а не отвлечение.

## 3. Неизменяемые правила

- `code/tests/gates` важнее документов.
- Управляемое ядро важнее ширины интерфейса.
- `policy / HITL / evals` важнее расширения автономии AI.
- `self-host / localized` готовность важнее `SaaS`-ширины.
- Техкарта и governed execution важнее вторичных доменных оболочек.

## 4. Главный порядок действий

### Шаг 1. Заморозить всё, что не относится к ядру MVP

Что сделать:
зафиксировать, что сейчас не идут в приоритет `menu breadth`, широкое масштабирование `CRM / front-office`, новые агентные роли сверх текущего важного состава, новые интеграции, `SaaS / hybrid`-ветка и декоративное расширение `web`.

Зачем:
это сразу освобождает внимание под реальные блокеры и не даёт команде спутать ширину с готовностью.

Считать завершённым, когда:
все новые задачи проверяются через правило `ядро MVP или нет`, а вторичные контуры не попадают в верх очереди.

Подтверждение:
[RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md)

### Шаг 2. Закрыть юридические блокеры

Что сделать:
собрать и принять внешние legal-артефакты по приоритетной восьмёрке `ELP-20260328-01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`.

Простыми словами это значит:

- подтвердить, кто оператор данных;
- подтвердить статус по РКН;
- подтвердить, где реально живут данные;
- подтвердить внешних обработчиков и договоры;
- закрыть вопрос трансграничной передачи;
- закрыть lawful basis и privacy notices;
- закрыть retention/deletion;
- закрыть права на ПО и цепочку прав.

Зачем:
без этого нельзя честно выходить даже в контролируемый pilot с ПДн.

Считать завершённым, когда:
карточки legal evidence переведены в `accepted`, а legal verdict перестаёт быть `NO-GO`.

Подтверждение:
[RF_COMPLIANCE_REVIEW_2026-03-28.md](/root/RAI_EP/docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md)
[COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md](/root/RAI_EP/docs/05_OPERATIONS/COMPLIANCE_OPERATOR_AND_PRIVACY_REGISTER.md)

### Шаг 3. Снизить `AppSec` и dependency-риск до безопасного порога

Что сделать:
разобрать `security:audit`-долги, закрыть критичные и высокие зависимости, довести secret hygiene и не оставлять security baseline в условном состоянии.

Зачем:
даже хороший продукт нельзя безопасно запускать, если базовый security-risk остаётся красным.

Считать завершённым, когда:
security baseline больше не выглядит как условный допуск и не блокирует `Tier 1`.

Подтверждение:
[ENTERPRISE_DUE_DILIGENCE_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md)
[ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md)

### Шаг 4. Закрыть правила безопасного поведения AI

Что сделать:
довести до рабочего состояния три вещи:

- матрицу разрешённых инструментов;
- матрицу обязательного участия человека `HITL`;
- формальный набор AI safety/eval-проверок.

Зачем:
иначе агентное ядро будет технически существовать, но останется опасным или непредсказуемым.

Считать завершённым, когда:
для risky-действий ясно, что агенту можно, что нельзя и где обязательно подтверждение человека.

Подтверждение:
[RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md](/root/RAI_EP/docs/04_AI_SYSTEM/RAI_EP_AI_GOVERNANCE_AND_AUTONOMY_POLICY.md)
[AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md](/root/RAI_EP/docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md)

### Шаг 5. Доказать, что систему можно поставить и восстановить

Что сделать:
собрать install/upgrade packet, подтвердить `backup / restore`, и зафиксировать понятный `self-host` путь без магии и ручных скрытых шагов.

Зачем:
если систему нельзя нормально поставить, обновить и восстановить, это ещё не pilot-ready продукт.

Считать завершённым, когда:
есть подтверждённый путь установки и проверенный сценарий восстановления после сбоя.

Подтверждение:
[RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md)
[ENTERPRISE_DUE_DILIGENCE_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md)

### Шаг 6. Довести до конца ядро Техкарты и execution-loop

Что сделать:
замкнуть контур `TechMap -> execution -> deviation -> result`, чтобы Техкарта была не документом “для вида”, а центром управляемого исполнения.

Зачем:
это и есть реальное смысловое ядро продукта, а не просто чат.

Считать завершённым, когда:
Техкарта проходит путь от входного контекста до управляемого результата и отклонений как один связный сценарий.

Подтверждение:
[RAI_EP_TECHMAP_OPERATING_CORE.md](/root/RAI_EP/docs/02_DOMAINS/RAI_EP_TECHMAP_OPERATING_CORE.md)
[RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md)

### Шаг 7. Сузить `web` до минимально нужного контура

Что сделать:
считать ближайшим `web`-продуктом только это:

- вход в систему;
- список чатов или тредов;
- диалог с агентом;
- governed work windows;
- explainability и evidence;
- минимальное управление агентами.

Зачем:
иначе команда уйдёт в дорисовку всего интерфейса и потеряет ядро.

Считать завершённым, когда:
через `web` можно реально войти, открыть тред, работать с агентом, видеть объяснимость и не зависеть от широкого меню.

Подтверждение:
[WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md](/root/RAI_EP/docs/07_EXECUTION/WEB_CHAT_FEASIBILITY_AND_IMPLEMENTATION_PLAN_2026-03-15.md)
[RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md)

### Шаг 8. Зафиксировать минимальные роли и границы доступа

Что сделать:
не расширять роли, а наоборот удержать минимальный понятный набор прав, `tenant`-границ и capability-ограничений.

Зачем:
многопользовательская система ломается не только из-за багов, но и из-за неясных границ доступа.

Считать завершённым, когда:
понятно, кто что может видеть, запускать, подтверждать и менять.

Подтверждение:
[ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md](/root/RAI_EP/docs/_audit/ENTERPRISE_EVIDENCE_MATRIX_2026-03-28.md)
[RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md)

### Шаг 9. После этого провести только ограниченный `self-host / localized` pilot

Что сделать:
не выходить сразу в широкий production, а запускать только контролируемый pilot на ограниченном контуре.

Зачем:
это даёт реальную проверку продукта без преждевременного масштабирования.

Считать завершённым, когда:
появляется доказанный `Tier 1` pilot-path, а не только внутреннее ощущение готовности.

Подтверждение:
[RAI_EP_TARGET_OPERATING_MODEL.md](/root/RAI_EP/docs/00_STRATEGY/RAI_EP_TARGET_OPERATING_MODEL.md)
[RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md](/root/RAI_EP/docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md)

### Шаг 10. И только после этого расширять продукт

Что сделать:
возвращаться к широкому масштабированию `CRM / front-office`, новым агентным ролям сверх текущего состава, `control tower`, широкому меню, новым интеграциям и более сложной автономии только после закрытия предыдущих шагов.

Зачем:
тогда расширение будет усиливать уже готовое ядро, а не скрывать его незрелость.

Считать завершённым, когда:
ядро уже работает, pilot доказан, а расширение не ломает governance, legal и release discipline.

Подтверждение:
[RAI_EP_EXECUTION_ROADMAP.md](/root/RAI_EP/docs/00_STRATEGY/RAI_EP_EXECUTION_ROADMAP.md)
[RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md](/root/RAI_EP/docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md)

## 5. Что делать прямо сейчас

Вот правильный ближайший короткий порядок:

1. Остановить всё, что не относится к ядру MVP.
2. Закрыть `legal / privacy / operator / residency / IP`-пакет.
3. Снизить `AppSec` и dependency-risk.
4. Зафиксировать `tool / HITL / eval` правила для AI.
5. Доказать installability, `backup / restore` и `self-host`-готовность.
6. Замкнуть Техкарту и execution-loop.
7. Сузить `web` до минимального управляемого контура.
8. Закрепить роли, права и границы доступа.
9. Провести ограниченный `self-host / localized` pilot.
10. Только потом возвращаться к ширине продукта.

## 6. Как понять, что мы идём правильно

Мы идём правильно, если одновременно верны следующие вещи:

- продукт становится не шире, а собраннее;
- legal-статус перестаёт быть главным стопом;
- AI становится безопаснее, а не автономнее;
- `web` становится практичнее, а не просто красивее;
- `self-host` путь становится проще и доказуемее;
- Техкарта превращается в центр исполнения, а не в один из экранов;
- каждый следующий шаг улучшает readiness, а не только количество функций.

## 7. Короткий вывод для owner

Тебе не нужно сейчас думать как архитектор большого enterprise-продукта.

Тебе нужно держать одну простую управленческую линию:

- сначала убрать всё, что реально мешает безопасному и законному запуску;
- потом довести ядро `Agent Core + Minimal Web Surface + TechMap execution loop`;
- и только после этого расширять продукт.

Это и есть правильный порядок развития RAI_EP на текущем этапе.
