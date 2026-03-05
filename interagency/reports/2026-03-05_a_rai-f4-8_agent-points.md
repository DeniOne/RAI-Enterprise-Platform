## Report — 2026-03-05_a_rai-f4-8_agent-points

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-8_agent-points.md`
- **Scope**: Agent Points и Reputation Levels — начисление/снятие баллов, уровни STABLE/TRUSTED/AUTONOMOUS, изоляция по companyId.

---

## 1. Изменённые файлы

- **Prisma**:
  - `packages/prisma-client/schema.prisma` — enum `ReputationLevel` (STABLE, TRUSTED, AUTONOMOUS); модель `AgentReputation` (id, companyId, agentRole, points, reputationLevel, updatedAt), unique(companyId, agentRole); в `Company` добавлена связь `agentReputations`.
  - `apps/api/src/shared/prisma/prisma.service.ts` — модель `AgentReputation` добавлена в `tenantScopedModels`.

- **Backend (api)**:
  - `apps/api/src/modules/rai-chat/agent-reputation.service.ts` — сервис: `awardPoints`, `deductPoints`, `getByCompanyAndAgent`, пороги 0–100 STABLE, 101–500 TRUSTED, >500 AUTONOMOUS.
  - `apps/api/src/modules/rai-chat/agent-reputation.service.spec.ts` — unit-тесты: начисление 0→10 STABLE; переход 95+10→105 TRUSTED; штраф 110−50→60 STABLE; изоляция по companyId.
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts` — провайдер `AgentReputationService`.

- **Попутно (для прохождения tsc после prisma generate)**:
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts` и `.spec.ts` — использование уникального ключа `trace_summary_trace_company_unique` вместо устаревшего `traceId_companyId` в соответствии с сгенерированным клиентом.

- **Interagency**:
  - `interagency/INDEX.md` — статус F4-8 → DONE, отчёт READY_FOR_REVIEW.

---

## 2. tsc --noEmit

Команда (из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат: **Exit code 0**, ошибок нет.

---

## 3. Jest — целевые тесты

Команда (из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/rai-chat/agent-reputation.service.spec.ts
```

Результат:

- **PASS**: 1 suite, 4 tests.
- Начисление баллов 0→10, уровень STABLE.
- Переход уровня 95→105, смена на TRUSTED.
- Штраф 110→60, понижение до STABLE.
- Изоляция по companyId (findUnique по companyId+agentRole).

---

## 4. Smoke / логика

- Репутация хранится по паре (companyId, agentRole); создаётся при первом начислении/снятии.
- Баллы не уходят в минус (max(0, points ± delta)).
- Уровень пересчитывается при каждом award/deduct по порогам 100/500.

---

## 5. READY_FOR_REVIEW

Ревью-пак собран. Дальше — ревью Antigravity (TECHLEAD).
