---
id: DOC-ARV-ARCHIVE-PROMPT-CHANGE-RFC-1V64
layer: Archive
type: Legacy
status: archived
version: 0.1.0
---
# PromptChange RFC — процесс изменения промтов A_RAI

**Статус:** Обязательный процесс для всех изменений промтов агентов.  
**Базис:** RAI_AI_SYSTEM_ARCHITECTURE.md §7.4.

---

## 1. RFC (Request for Change)

Перед изменением промта агента:

- Описать **цель** изменения (что улучшаем).
- Описать **ожидаемый эффект** (метрики, поведение).
- Описать **риски** (регрессии, граничные кейсы).
- Зафиксировать в репозитории (RFC-файл или MR description).

---

## 2. EvalRun на GoldenTestSet

- Запустить `GoldenTestRunnerService.runEval(agentName, testSet)` (или CI-пайплайн).
- Критерий: все тесты из Golden Test Set проходят (passed = N, failed = 0).
- Если хотя бы один тест падает → перейти к шагу 3 (Rollback-гвард).

---

## 3. Rollback-гвард

- Если **regressions > 0** (тесты, которые раньше проходили и теперь падают) → **ROLLBACK** к предыдущей версии промта.
- Не разворачивать новую версию в прод до устранения регрессий.
- Исправить промт или тесты, повторить EvalRun.

---

## 4. Canary rollout

- Если EvalRun **pass**:
  - Развернуть новую версию на **10%** трафика.
  - После проверки — **50%**, затем **100%**.
- На каждом этапе — проверка метрик и алертов.

---

## 5. Мониторинг 7 дней

- В течение 7 дней после 100% rollout вести мониторинг **AgentScoreCard**:
  - acceptanceRate, rejectionRate, correctionRate, hallucinationFlagRate.
- Логи и метрики привязаны к `promptVersion` и `modelVersion`.

---

## 6. Авто-rollback по rejectionRate

- Если **rejectionRate** вырос более чем на **5%** относительно базового периода → **автоматический rollback** к предыдущей версии промта.
- Уведомить владельца промта (TECHLEAD/команда), провести разбор.

---

## Итог

Изменение промта = RFC → EvalRun → (при regressions: rollback) → Canary → 7 дней мониторинга → при росте rejectionRate: auto-rollback.
