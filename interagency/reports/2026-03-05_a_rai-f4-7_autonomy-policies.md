## Report — 2026-03-05_a_rai-f4-7_autonomy-policies

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-7_autonomy-policies.md`
- **Scope**: Политики автономности по BS% — динамический уровень (AUTONOMOUS / TOOL_FIRST / QUARANTINE), интеграция в пайплайн тулзов (блокировка/эскалация при высоком BS%).

---

## 1. Изменённые файлы

- **Backend (api)**:
  - `apps/api/src/modules/rai-chat/autonomy-policy.service.ts` — новый сервис: enum `AutonomyLevel`, метод `getCompanyAutonomyLevel(companyId)` (окно 24ч по `TraceSummary.bsScorePct`, пороги 5% / 30%).
  - `apps/api/src/modules/rai-chat/autonomy-policy.service.spec.ts` — unit-тесты: BS% 2% → AUTONOMOUS, 15% → TOOL_FIRST, 40% → QUARANTINE.
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts` — провайдер `AutonomyPolicyService`.
  - `apps/api/src/modules/rai-chat/tools/rai-tools.registry.ts` — инъекция `AutonomyPolicyService`; в `execute()` перед RiskPolicy: при WRITE/CRITICAL проверка автономности; QUARANTINE → немедленный `RiskPolicyBlockedError` без PendingAction; TOOL_FIRST → принудительный PendingAction даже при ALLOWED от RiskPolicy.
  - `apps/api/src/modules/rai-chat/tools/rai-tools.registry.spec.ts` — мок `AutonomyPolicyService`; тесты: QUARANTINE блокирует мутирующий тулз до RiskPolicy; TOOL_FIRST форсирует PendingAction при ALLOWED.

- **Interagency**:
  - `interagency/INDEX.md` — статус промта F4-7 → DONE, отчёт READY_FOR_REVIEW.

---

## 2. tsc --noEmit

Команда (из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат:

- **Exit code**: 0
- Ошибок компиляции нет.

---

## 3. Jest — целевые тесты

Команда (из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/rai-chat/autonomy-policy.service.spec.ts src/modules/rai-chat/tools/rai-tools.registry.spec.ts
```

Результат:

- **PASS**: оба сьюта.
- **Suites**: 2 passed / 2 total
- **Tests**: 13 passed / 13 total

Покрытие:

- **AutonomyPolicyService**: BS% = 2% → AUTONOMOUS; 15% → TOOL_FIRST; 40% → QUARANTINE.
- **RaiToolsRegistry**: QUARANTINE блокирует `GenerateTechMapDraft` до RiskPolicy, без создания PendingAction; TOOL_FIRST при ALLOWED всё равно создаёт PendingAction и блокирует выполнение.

---

## 4. Smoke / логика

- Уровень автономности считается динамически по среднему `bsScorePct` за последние 24 часа по `companyId` (изоляция соблюдена).
- QUARANTINE: мутирующие тулзы (WRITE/CRITICAL) блокируются сразу, без PendingAction — только чтение.
- TOOL_FIRST: мутирующие тулзы идут только через PendingAction (подтверждение человека).
- Интеграция в существующий Two-Person Rule: RiskPolicy по-прежнему даёт вердикт; автономность ужесточает (QUARANTINE/TOOL_FIRST) поверх него.

---

## 5. READY_FOR_REVIEW

Ревью-пак собран. Дальше — ревью Antigravity (TECHLEAD).
