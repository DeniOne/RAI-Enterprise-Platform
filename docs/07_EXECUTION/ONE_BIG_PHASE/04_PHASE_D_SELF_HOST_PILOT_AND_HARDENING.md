---
id: DOC-EXE-ONE-BIG-PHASE-D-SELF-HOST-PILOT-20260330
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-30
claim_id: CLAIM-EXE-ONE-BIG-PHASE-D-SELF-HOST-PILOT-20260330
claim_status: asserted
verified_by: manual
last_verified: 2026-03-30
evidence_refs: docs/07_EXECUTION/ONE_BIG_PHASE/INDEX.md;docs/05_OPERATIONS/RAI_EP_ENTERPRISE_RELEASE_CRITERIA.md;docs/_audit/ENTERPRISE_DUE_DILIGENCE_2026-03-28.md;docs/05_OPERATIONS/WORKFLOWS/RELEASE_BACKUP_RESTORE_AND_DR_RUNBOOK.md;docs/05_OPERATIONS/HOSTING_TRANSBORDER_AND_DEPLOYMENT_MATRIX.md
---
# Phase D — Self-Host Pilot And Hardening

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-D-SELF-HOST-PILOT-20260330
status: asserted
verified_by: manual
last_verified: 2026-03-30

Это подфаза, где ядро превращается в честный `Tier 1 self-host / localized` pilot-контур.

## 1. Цель подфазы

Подготовить не просто работающую систему, а систему, которую можно поставить, поднять, поддерживать и аккуратно пилотировать.

## 2. Чеклист

### 2.1. Собрать честный `self-host`-пакет

- [ ] Убедиться, что путь развертывания соответствует реальному `localized` сценарию.
- [ ] Не держать критичные части знания только “в голове”.
- [ ] Подготовить понятный набор шагов установки и обновления.

### 2.2. Подтвердить восстановление после сбоя

- [ ] Провести и зафиксировать сценарий `backup / restore`.
- [ ] Проверить, что потеря среды не превращает запуск в ручную импровизацию.
- [ ] Не считать runbook достаточным без исполнения.

### 2.3. Закрепить operational discipline

- [ ] Стабилизировать `monitoring / incident / rollback / support` контур.
- [ ] Не входить в pilot с режимом “разберёмся вручную при проблеме”.
- [ ] Зафиксировать, кто и как реагирует на сбой.

### 2.4. Подготовить controlled pilot

- [ ] Запускать только ограниченный `self-host / localized` pilot.
- [ ] Не делать вид, что система готова к широкому внешнему production.
- [ ] Определить, что считается успешным pilot-проходом.

### 2.5. Сохранить жёсткую границу против преждевременной ширины

- [ ] Не открывать `SaaS / hybrid` путь до доказанного `self-host`-контура.
- [ ] Не расширять breadth-задачи под видом “подготовки к пилоту”.

## 3. Что должно измениться по итогам подфазы

- проект получает честный `Tier 1` путь;
- pilot становится воспроизводимым, а не “героическим”;
- восстановление и сопровождение перестают быть скрытым риском;
- следующий шаг в сторону более серьёзной эксплуатации становится понятным.

## 4. Подфаза считается завершённой, когда

- `self-host`-путь повторяем;
- `backup / restore` подтверждён делом;
- pilot запускается как controlled contour;
- операционная поддержка не опирается на хаос и память отдельных людей.

## 5. Что запрещено до завершения подфазы

- объявлять продукт production-ready;
- уходить в широкий rollout;
- заменять operational hardening красивыми dashboard-ами;
- поднимать `Tier 2` и выше, пока `Tier 1` не доказан на деле.
