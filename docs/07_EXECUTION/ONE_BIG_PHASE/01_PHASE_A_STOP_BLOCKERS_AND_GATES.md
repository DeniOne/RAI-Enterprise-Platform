---
id: DOC-EXE-ONE-BIG-PHASE-A-STOP-BLOCKERS-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.4.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-STOP-BLOCKERS-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-03-30
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/07_EXECUTION/RAI_EP_PRIORITY_SYNTHESIS_MASTER_REPORT.md;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md
---
# Phase A — Stop-Blockers And Gates

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-STOP-BLOCKERS-20260330
status: asserted
verified_by: manual
last_verified: 2026-03-30

Это первая и самая важная подфаза. Её смысл — убрать всё, что делает ближайший MVP опасным, юридически спорным или нечестно готовым.

Рабочие документы этой подфазы:

- [PHASE_A_IMPLEMENTATION_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_IMPLEMENTATION_PLAN.md)
- [PHASE_A1_LEGAL_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_LEGAL_CLOSEOUT_PLAN.md)
- [PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_FIRST_WAVE_EXECUTION_CHECKLIST.md)
- [PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_01_OPERATOR_MEMO_CHECKLIST.md)
- [PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A1_ELP_03_HOSTING_RESIDENCY_CHECKLIST.md)
- [PHASE_A2_SECURITY_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A2_SECURITY_CLOSEOUT_PLAN.md)
- [PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A3_AI_GOVERNANCE_CLOSEOUT_PLAN.md)
- [PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A4_INSTALLABILITY_AND_RECOVERY_PLAN.md)
- [PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A5_IP_AND_OSS_CLOSEOUT_PLAN.md)
- [PHASE_A_EXECUTION_BOARD.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXECUTION_BOARD.md)
- [PHASE_A_EVIDENCE_MATRIX.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EVIDENCE_MATRIX.md)

## 1. Цель подфазы

Снять стоп-блокеры перед реальным движением к MVP-pilot:

- `legal / privacy / operator / residency`;
- `AppSec` и dependency-risk;
- `tool / HITL / eval`-контур AI;
- installability и восстановление;
- `IP / OSS / chain-of-title`.

## 2. Чеклист

### 2.1. Сначала остановить распыление

- [ ] Зафиксировать, что в верх очереди не идут `menu breadth`, новые агентные роли сверх текущего важного состава, широкое масштабирование `CRM / front-office`, новые интеграции и `SaaS / hybrid`.
- [ ] Не брать в работу задачи, которые не двигают `legal`, `security`, `AI governance`, installability или `self-host`.
- [ ] Любую новую задачу прогонять через вопрос: это закрывает blocker или это только ширина?

Важно:

- существующие `front-office` и `CRM`-контуры не считаются "лишними" или "новыми";
- под ограничением находится не их существование, а преждевременное расширение в ширину раньше закрытия stop-blockers;
- если текущие `front-office / CRM` агенты нужны для governed chat, тредов, handoff и управляемого рабочего контура, они остаются частью ближайшего MVP.

### 2.2. Закрыть legal-пакет

- [ ] Пройти приоритетную восьмёрку `ELP-20260328-01`, `02`, `03`, `04`, `05`, `06`, `08`, `09`.
- [ ] Для каждого `ELP-*` перевести карточку хотя бы в понятный owner-driven статус с реальным внешним документом.
- [ ] Довести ключевые документы до `accepted`, а не только до внутренних шаблонов и draft-ов.
- [ ] Пересчитывать legal-verdict после каждого принятого артефакта.
- [ ] Не считать внутренние `docs` заменой внешнему legal evidence.

### 2.3. Закрыть security и dependency-risk

- [ ] Разобрать критичные и высокие зависимости из security baseline.
- [ ] Не выпускать новый `Tier 1` путь, пока security-risk не снижен до управляемого состояния.
- [ ] Проверить, что tracked secret leakage не вернулся.
- [ ] Не допускать появления новых unsafe путей ради ускорения разработки.

### 2.4. Закрыть AI safety rules

- [ ] Собрать универсальную матрицу разрешённых инструментов.
- [ ] Собрать универсальную матрицу обязательного участия человека.
- [ ] Определить, какие действия агент может только советовать, а не выполнять.
- [ ] Довести формальный набор safety/eval-проверок для risky-сценариев.
- [ ] Не расширять автономию AI, пока эти три контура не закрыты.

### 2.5. Доказать installability и восстановление

- [ ] Собрать install/upgrade packet для `self-host`-пути.
- [ ] Провести подтверждённый `backup / restore` сценарий.
- [ ] Проверить, что путь установки и восстановления можно повторить без скрытых ручных знаний.
- [ ] Не считать продукт пригодным к pilot, пока он не ставится и не восстанавливается предсказуемо.

### 2.6. Закрыть `IP / OSS / chain-of-title`

- [ ] Разобрать `unknown licenses`.
- [ ] Закрыть цепочку прав на код, базу и know-how.
- [ ] Не двигаться к внешнему pilot, пока права на продукт остаются спорными.

## 3. Что должно измениться по итогам подфазы

- legal перестаёт быть главным стопом первого уровня;
- security baseline перестаёт быть условным;
- AI runtime получает реальные границы;
- `self-host` путь становится доказуемым;
- выпуск MVP перестаёт зависеть от скрытых организационных дыр.

## 4. Подфаза считается завершённой, когда

- `Legal / Compliance` перестаёт быть безусловным стоп-фактором для `Tier 1`;
- security и dependency-risk опущены до управляемого уровня;
- `tool / HITL / eval` контур существует как реальное правило, а не как намерение;
- installability и `backup / restore` подтверждены;
- `IP / OSS` не висят как красный внешний риск.

## 5. Что запрещено до завершения подфазы

- расширять продукт в ширину;
- наращивать автономию AI;
- считать зелёные тесты достаточным release-сигналом;
- думать про широкий внешний запуск;
- считать `web`-ширину заменой stop-blocker closeout.
