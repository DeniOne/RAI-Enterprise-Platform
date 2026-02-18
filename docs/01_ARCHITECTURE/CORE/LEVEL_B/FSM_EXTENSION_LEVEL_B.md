# FSM_EXTENSION_LEVEL_B.md

## 0. Статус документа

- **Система:** RAI_Enterprise_Platform
- **Уровень зрелости:** LEVEL B — Generative Agronomy Engine
- **Статус:** DRAFT / ARCHITECTURAL SPECIFICATION
- **Зависимости:** LEVEL_A_BASELINE_VERIFIED_SPEC.md

---

## 1. Назначение документа

Данный документ определяет **формальное расширение FSM** для поддержки генеративных черновиков в Level B. Все правила Level A сохраняются, добавляется новое состояние и переходы.

---

## 2. Расширенная модель состояний

### 2.1 Список состояний Level B

1. `GENERATED_DRAFT` — **NEW:** Черновик, созданный ИИ-движком.
2. `DRAFT` — Черновик, доступен для мутаций (Level A).
3. `REVIEW` — Проверка, блокировка частичных правок (Level A).
4. `APPROVED` — Утверждено, мутации запрещены (Level A).
5. `FROZEN` — Заморожено, любая мутация невозможна (Level A).

---

### 2.2 Матрица переходов состояний (Level B)

| Текущее состояние | Событие (Event) | Следующее состояние | Допущено | Обоснование |
| :--- | :--- | :--- | :--- | :--- |
| `GENERATED_DRAFT` | `HUMAN_APPROVE_DRAFT` | `DRAFT` | ДА | Одобрение генеративного черновика |
| `GENERATED_DRAFT` | `REJECT_GENERATION` | ∅ (удаление) | ДА | Отклонение генерации |
| `GENERATED_DRAFT` | `AUTO_APPROVE` | `DRAFT` | **НЕТ** | Нарушение I15 (Generated Draft Isolation) |
| `DRAFT` | `SUBMIT` | `REVIEW` | ДА | Передача на проверку (Level A) |
| `REVIEW` | `REJECT` | `DRAFT` | ДА | Возврат на доработку (Level A) |
| `REVIEW` | `APPROVE` | `APPROVED` | ДА | Фиксация решения (Level A) |
| `APPROVED` | `FREEZE` | `FROZEN` | ДА | Окончательная блокировка (Level A) |
| `FROZEN` | `EDIT` | `DRAFT` | **НЕТ** | Нарушение I3 (Freeze Irreversibility) |
| `ANY` | `UNAUTHORIZED_JUMP` | `ANY` | **НЕТ** | Нарушение I2 (No Illegal Transition) |

---

### 2.3 Диаграмма переходов (ASCII)

```text
[[ GENERATED_DRAFT ]] --(HUMAN_APPROVE_DRAFT)--> [ DRAFT ] --(SUBMIT)--> [ REVIEW ] --(APPROVE)--> [ APPROVED ] --(FREEZE)--> [[ FROZEN ]]
         |                                           ^                        |
         |                                           +-------(REJECT)---------+
         |
         +-------(REJECT_GENERATION)-----> ∅ (удаление)
```

---

## 3. Формальные доказательства (Level B)

### 3.1 Доказательство детерминизма (I1)

Для каждого кортежа (Состояние S, Событие E) в коде `AgroOrchestratorService` определен строго один результирующий переход. Функция перехода `δ(S, E) -> S'` остается однозначной.

**Расширение:** Добавлены переходы для `GENERATED_DRAFT`, но функция остается детерминированной.

[Invariant: I1 | Test Level: L4 | Trace: FSM_DET_B01]

---

### 3.2 Доказательство отсутствия недостижимых состояний (Unreachable States)

Все состояния {`GENERATED_DRAFT`, `DRAFT`, `REVIEW`, `APPROVED`, `FROZEN`} достижимы:

- `GENERATED_DRAFT`: Создается Generative Engine.
- `DRAFT`: `δ(GENERATED_DRAFT, HUMAN_APPROVE_DRAFT)` или создание вручную.
- `REVIEW`: `δ(DRAFT, SUBMIT)`.
- `APPROVED`: `δ(REVIEW, APPROVE)`.
- `FROZEN`: `δ(APPROVED, FREEZE)`.

[Invariant: I1 | Test Level: L4 | Trace: FSM_REACH_B01]

---

### 3.3 Доказательство отсутствия тупиков (Deadlocks)

- В состоянии `GENERATED_DRAFT` существует 2 исходящих перехода: `HUMAN_APPROVE_DRAFT` и `REJECT_GENERATION`.
- В состояниях `DRAFT`, `REVIEW`, `APPROVED` существует как минимум 1 исходящий переход (Level A).
- Состояние `FROZEN` является целевым терминальным состоянием (Level A).

[Invariant: I1 | Test Level: L4 | Trace: FSM_DEADLOCK_B01]

---

### 3.4 Блокировка автоматического одобрения (I15)

Переход `GENERATED_DRAFT -> DRAFT` возможен **только** через событие `HUMAN_APPROVE_DRAFT`, которое требует явного действия пользователя. Любые попытки автоматического перехода блокируются IntegrityGate.

**Механизм (Security-Hardened):**
```typescript
class AgroOrchestratorService {
  async approveDraft(techMapId: string, actor: Actor): Promise<void> {
    const techMap = await this.repo.findById(techMapId);
    
    if (techMap.status !== 'GENERATED_DRAFT') {
      throw new IllegalStateTransitionException();
    }
    
    // Security-hardened: проверка типа актора, а не строки userId
    if (actor.type !== 'HUMAN') {
      throw new AutoApprovalDeniedException('I15 violation: Only HUMAN actors can approve generated drafts');
    }
    
    // Дополнительная проверка полномочий
    if (!actor.hasAuthority('APPROVE_GENERATED_DRAFT')) {
      throw new InsufficientAuthorityException('Actor lacks APPROVE_GENERATED_DRAFT authority');
    }
    
    await this.transitionTo(techMapId, 'DRAFT', actor);
  }
}

interface Actor {
  id: string;
  type: 'HUMAN' | 'AI' | 'SYSTEM';
  role: string;
  authorities: string[];
  hasAuthority(authority: string): boolean;
}
```

**Обоснование:**
- Проверка `userId === 'system'` уязвима к подмене строки.
- Проверка `actor.type !== 'HUMAN'` проверяет роль, а не строку.
- Дополнительная проверка `hasAuthority()` усиливает контроль доступа.

[Invariant: I15 | Test Level: L4 | Trace: GEN_ISO_01]

---

### 3.5 Доказательство отсутствия циклов (Non-Circularity)

**Определение:** Граф переходов FSM Level B не содержит циклов, за исключением явно разрешенного цикла `REVIEW ↔ DRAFT`.

**Формальное доказательство:**

1. **Анализ графа переходов:**
   - `GENERATED_DRAFT` → `DRAFT` (однонаправленный)
   - `GENERATED_DRAFT` → ∅ (терминальный)
   - `DRAFT` ↔ `REVIEW` (единственный цикл)
   - `REVIEW` → `APPROVED` (однонаправленный)
   - `APPROVED` → `FROZEN` (однонаправленный)

2. **Проверка отсутствия циклов с участием `GENERATED_DRAFT`:**
   - Нет обратного перехода `DRAFT` → `GENERATED_DRAFT`
   - Нет обратного перехода `REVIEW` → `GENERATED_DRAFT`
   - Нет обратного перехода `APPROVED` → `GENERATED_DRAFT`
   - Нет обратного перехода `FROZEN` → `GENERATED_DRAFT`

3. **Проверка отсутствия циклов с участием `APPROVED` и `FROZEN`:**
   - Нет обратного перехода `FROZEN` → `APPROVED`
   - Нет обратного перехода `FROZEN` → `REVIEW`
   - Нет обратного перехода `FROZEN` → `DRAFT`
   - Нет обратного перехода `APPROVED` → `REVIEW`
   - Нет обратного перехода `APPROVED` → `DRAFT`

4. **Единственный разрешенный цикл:**
   - `DRAFT` ↔ `REVIEW` (для итеративной доработки)

**Вывод:** Граф переходов является **ациклическим** за исключением контролируемого цикла `DRAFT ↔ REVIEW`, что гарантирует прогресс состояний к терминальному состоянию `FROZEN`.

**Формальная запись:**
```
Для любого пути P = (s₁, s₂, ..., sₙ) в графе переходов:
- Если s₁ = GENERATED_DRAFT, то sᵢ ≠ GENERATED_DRAFT для всех i > 1
- Если sᵢ = FROZEN, то sⱼ ≠ FROZEN для всех j < i (FROZEN достижим только один раз)
- Единственный цикл: {DRAFT, REVIEW}
```

[Invariant: I1, I2 | Test Level: L4 | Trace: FSM_NOCIRC_B01]

---

## 4. Новые события Level B

| Событие | Описание | Источник | Целевое состояние |
| :--- | :--- | :--- | :--- |
| `HUMAN_APPROVE_DRAFT` | Одобрение генеративного черновика | User Action | `DRAFT` |
| `REJECT_GENERATION` | Отклонение генерации | User Action | ∅ (удаление) |

---

## 5. Метаданные состояний

### 5.1 GENERATED_DRAFT

**Обязательные поля:**
- `generationMetadata` (I16):
  ```json
  {
    "modelId": "string",
    "modelVersion": "string",
    "inputParams": "object",
    "generatedAt": "iso8601",
    "generationStrategy": "string"
  }
  ```

**Ограничения:**
- Переход в `DRAFT` требует `HUMAN_APPROVE_DRAFT`.
- Автоматический переход запрещен.

---

### 5.2 DRAFT, REVIEW, APPROVED, FROZEN

**Без изменений** (Level A).

---

## 6. Интеграция с IntegrityGate

### 6.1 Pre-Generation Validation

Перед созданием `GENERATED_DRAFT` IntegrityGate проверяет:
- Валидность входных параметров.
- Наличие стратегии в библиотеке.
- Соответствие региональным ограничениям.

**Механизм:**
```typescript
class GenerativeEngineService {
  async generateTechMap(params: GenerationParams): Promise<TechMap> {
    // Pre-Generation Validation
    const validationResult = await this.integrityGate.validateGenerationInput(params);
    if (!validationResult.isValid) {
      throw new GenerationValidationException(validationResult.errors);
    }
    
    // Генерация
    const draft = await this.engine.generate(params);
    
    // Post-Generation Validation
    const draftValidation = await this.integrityGate.validateGeneratedDraft(draft);
    if (!draftValidation.isValid) {
      throw new GeneratedDraftInvalidException(draftValidation.errors);
    }
    
    return draft;
  }
}
```

[Invariant: I21 | Test Level: L3 | Trace: CONST_PROP_01]

---

## 7. Негативные сценарии (Adversarial Tests)

1. **Попытка автоматического перехода GENERATED_DRAFT -> DRAFT (I15):**
   - Вход: `approveDraft(techMapId, { type: 'AI', ... })`
   - Ожидаемый результат: `AutoApprovalDeniedException` (L6)

2. **Попытка системного перехода GENERATED_DRAFT -> DRAFT (I15):**
   - Вход: `approveDraft(techMapId, { type: 'SYSTEM', ... })`
   - Ожидаемый результат: `AutoApprovalDeniedException` (L6)

2. **Попытка прыжка GENERATED_DRAFT -> APPROVED (I2):**
   - Вход: `transitionTo(techMapId, 'APPROVED', userId)`
   - Ожидаемый результат: `IllegalStateTransitionException` (L6)

3. **Генерация без метаданных (I16):**
   - Вход: Создание `GENERATED_DRAFT` без поля `generationMetadata`
   - Ожидаемый результат: `ValidationException` (L5)

4. **Генерация с нарушением Constraint (I21):**
   - Вход: Генерация TechMap с нормой высева выше регионального лимита
   - Ожидаемый результат: `GeneratedDraftInvalidException` (L3)

---

## 8. Формальная граница FSM Level B

**Добавлено:**
- 1 новое состояние (`GENERATED_DRAFT`).
- 2 новых события (`HUMAN_APPROVE_DRAFT`, `REJECT_GENERATION`).
- 2 новых перехода.

**Сохранено:**
- Все переходы Level A.
- Все инварианты Level A (I1–I14).
- Детерминизм, достижимость, отсутствие deadlocks.

**Вывод:** FSM Level B является **консервативным расширением** FSM Level A с добавлением контролируемого генеративного слоя.
