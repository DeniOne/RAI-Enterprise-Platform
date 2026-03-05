## Report — 2026-03-05_a_rai-f4-9_feedback-credibility

- **Prompt**: `interagency/prompts/2026-03-05_a_rai-f4-9_feedback-credibility.md`
- **Scope**: Feedback Credibility Score для пользователей — профиль доверия к фидбэку, мультипликатор 0.1–1.0, интеграция в backend (готово к использованию в AgentReputation/Points).

---

## 1. Изменённые файлы

- **Prisma**:
  - `packages/prisma-client/schema.prisma`:
    - Добавлена модель `UserCredibilityProfile`:
      - `id`, `userId`, `companyId`, `credibilityScore`, `totalFeedbacks`, `invalidatedFeedbacks`, `updatedAt`.
      - Связь с `Company` (tenant isolation).
      - `@@unique([companyId, userId], name: "user_credibility_company_user_unique")`.
      - Таблица `ai_user_credibility_profiles`.
    - В `Company` добавлен массив `userCredibilityProfiles UserCredibilityProfile[]`.
  - `apps/api/src/shared/prisma/prisma.service.ts`:
    - Модель `UserCredibilityProfile` добавлена в `tenantScopedModels` → все операции идут через TenantContext (companyId не из payload).

- **Backend (api)**:
  - `apps/api/src/modules/rai-chat/feedback-credibility.service.ts`:
    - Сервис `FeedbackCredibilityService`:
      - `getMultiplier(userId, companyId): Promise<number>`:
        - Получает или создаёт профиль (дефолт `credibilityScore = 100`, множитель = 1.0).
        - Возвращает `multiplier = clamp(0.1, 1.0, credibilityScore / 100)`.
      - `invalidateFeedback(userId, companyId)`:
        - Увеличивает `totalFeedbacks` и `invalidatedFeedbacks`.
        - Пересчитывает `credibilityScore = round(100 * (1 - invalidated/total))`, нижняя граница 0.
        - Обновляет профиль в БД.
  - `apps/api/src/modules/rai-chat/feedback-credibility.service.spec.ts`:
    - Unit-тесты сервиса:
      - Дефолтный юзер (нет записи) → создаётся профиль с `credibilityScore = 100`, `getMultiplier` возвращает `1.0`.
      - `invalidateFeedback` для профиля (1 валидный, 0 invalid) → после инвалидации (2 total, 1 invalid) `credibilityScore = 50`, `multiplier = 0.5`.
      - Изоляция по `companyId`: `findUnique` вызывается с compound ключом `user_credibility_company_user_unique: { companyId, userId }`.
  - `apps/api/src/modules/rai-chat/rai-chat.module.ts`:
    - Добавлен провайдер `FeedbackCredibilityService` (готов к дальнейшей интеграции с AgentReputation/Agent Points).

---

## 2. tsc --noEmit

Команда (из `apps/api`):

```bash
cd apps/api && pnpm exec tsc --noEmit
```

Результат:

- **Exit code**: 0
- Ошибок компиляции нет (в scope `apps/api`).

---

## 3. Jest — целевые тесты

Команда (из `apps/api`):

```bash
cd apps/api && pnpm test -- --runTestsByPath src/modules/rai-chat/feedback-credibility.service.spec.ts
```

Результат:

- **PASS**: `FeedbackCredibilityService` (1 suite, 3 tests).
- Покрыто:
  - Дефолтный профиль → множитель 1.0.
  - Инвалидация → снижение `credibilityScore` и мультипликатора до 0.5.
  - Изоляция по `companyId` через compound unique.

---

## 4. Поведение Feedback Credibility

- **Профиль**:
  - Для каждой пары `(companyId, userId)` создаётся один `UserCredibilityProfile`.
  - Дефолт: `credibilityScore = 100`, `totalFeedbacks = 0`, `invalidatedFeedbacks = 0`.
- **Мультипликатор**:
  - `multiplier = clamp(0.1, 1.0, credibilityScore / 100)`.
  - При накоплении invalidated feedbacks доля `invalidated/total` растёт → `credibilityScore` падает от 100 к 0 → мультипликатор от 1.0 к 0.1.
- **Интеграция**:
  - Сервис зарегистрирован в `RaiChatModule` и готов к использованию в `AgentReputationService` (мультипликатор фидбэка при начислении очков).

---

## 5. READY_FOR_REVIEW

Ревью-пак собран. Дальше — ревью Antigravity (TECHLEAD).

