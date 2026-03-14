---
id: DOC-EXE-PHASE-DISIGN-ARCHITECTURAL-ROADMAP-INSTITU-1393
layer: Execution
type: Phase Plan
status: approved
version: 1.0.2
owners: [@techlead]
last_updated: 2026-02-21
---
# Архитектурный Роадмап: Institutional Build Plan
## Стратегия реализации RAI Enterprise Platform

> [!IMPORTANT]
> Мы придерживаемся строгой последовательности внедрения:
> **Governance Core → Institutional Infrastructure → Business Domains**
> Строительство бизнес-логики до готовности ядра управления запрещено. Любое отклонение считается архитектурным нарушением.

---

## Enforcement Model:
Все фазы исполняются в Institutional Enforcement Mode.
Любая реализация обязана соблюдать:

AuthorityContext

FSM-based transitions

Two-Phase Execution

Escalatory Governance

Ledger Binding

---

## Общий поток реализации

```mermaid
graph LR
    P0[PREP] --> P1[SHELL]
    P1 --> P2[EXECUTION]
    P2 --> P3[QUORUM]
    P3 --> P4[RISK]
    P4 --> P5[AI]
    P5 --> P6[LEDGER]
    P6 --> P7[DOMAINS]
    
    style P0 fill:#00ff00,stroke:#333,stroke-width:2px
    style P6 fill:#00ff00,stroke:#333,stroke-width:4px
```

---

## PHASE 0: Подготовка (Foundation / PREP)
**Срок:** 2–3 дня  
**Цель:** Подготовить каркас проекта под стандарты Institutional Frontend.

### Задачи:
*   **0.1 Базовая структура (apps/web/) [DONE]:**
    - `app/` (Router) [DONE]
    - `core/` (Services, Logic) [DONE]
    - `modules/` (Feature domains) [DONE]
    - `shared/` (UI Components, Utils) [DONE]
*   **0.2 Технологический стек [DONE]:**
    - Next.js App Router [DONE]
    - Tailwind + CSS Variables (Theming Layer) [DONE]
    - React Query (Server State) [DONE]
    - Zustand (Global State) [DONE]
    - XState (Governance FSM) [DONE]
    - Event Bus (mitt или rxjs) [DONE]
*   **0.3 Strict Mode & Linting [DONE]:**
    **Запретить [ENFORCED]:**
    - Прямые `role-check` в компонентах.
    - Использование `any`.
    - Mutable shared state (строгая иммутабельность).

> [!CHECKLIST]
> **Definition of Done (Phase 0):**
> - [x] Проект компилируется без ошибок в Strict Mode.
> - [x] Dev-server работает стабильно.
> - [x] Базовый `layout.tsx` существует и соответствует канону.
> - [x] Система темизации (Dark/Light) инициализирована.
> - [x] Библиотеки состояний (Zustand, XState) подключены и сконфигурированы.

---

## PHASE 1: Governance Shell (Institutional Skeleton)
**Срок:** Неделя 1  
**Цель:** Построить каркас системы управления без бизнес-логики.

### Задачи:
*   **1.1 App Layout (Без бизнес-логики):**
    - Создание `<GovernanceBar />`
    - Создание `<DomainTree />`
    - Создание `<WorkSurface />`
*   **1.2 AuthorityContext Layer:**
    ```typescript
    interface AuthorityContext {
      canOverride: boolean;
      canSign: boolean;
      canEscalate: boolean;
      canEdit: boolean;
      canApprove: boolean;
    }
    ```
    - Реализация `AuthorityProvider` и хука `useAuthority()`.
    - **Жесткий запрет:** Использование `user.role` внутри UI.
*   **1.3 Role Simulation Layer:**
    - Создание Mock-пользователей: `CEO`, `Director`, `Manager`, `Agronomist`.
    - Реализация переключения ролей через dev-панель для тестирования.

> [!CHECKLIST]
> **Definition of Done (Phase 1):**
> - [x] `GovernanceBar` корректно адаптируется под флаги `Authority`.
> - [x] В компонентах отсутствуют проверки ролей (только флаги полномочий).
> - [x] `DomainTree` фильтруется на основе `capability`.
> - [x] Механизм переключения Mock-ролей работает корректно.

---

## PHASE 2: Two-Phase Execution Engine (FSM Core)
**Срок:** Неделя 2  
**Цель:** Реализовать протокол Deferred Commit через XState.

### Задачи:
*   **2.1 Canonical FSM:**
    - Состояния: `initiated`, `pending`, `approved`, `rejected`, `executed`.
    - Каждое governance-действие обязано проходить через эту машину.
*   **2.2 GovernanceAction Hook:**
    - `useGovernanceAction()`: запуск FSM, инициация эскалации, возврат `state` + `traceId`.
*   **2.3 UI State Binding:**
    - При `state === pending`: отображение `EscalationBanner`, блокировка дублирующих действий.

> [!CHECKLIST]
> **Definition of Done (Phase 2):**
> - [x] Все кнопки управления (Decision Buttons) используют FSM.
> - [x] Отсутствуют прямые `setState` переходы для критических действий.
> - [x] Состояние PENDING визуально отображается и блокирует UI.
> - [x] Реализовано предотвращение дублирующих экшенов.
> - [x] `TraceID` корректно генерируется и отображается.

---

## PHASE 3: Escalation & TechCouncil Layer (Governance UI)
**Срок:** Неделя 3  
**Цель:** Визуализировать процессы эскалации и решения Техсовета по схеме M-of-N.

### Задачи:
*   **3.1 EscalationBanner (Canonical):**
    - Обязательные пропсы: `escalationId`, `committee`, `techCouncilProgress`, `traceId`, `riskLevel`.
*   **3.2 QuorumVisualizer (TechCouncil UI):**
    - Отображение: `required X of N`, список подписантов, текущий прогресс.
*   **3.3 SignatureGateModal:**
    - Слой mTLS handshake (симуляция), `payload preview`, подтверждение.

> [!CHECKLIST]
> **Definition of Done (Phase 3):**
> - [x] `EscalationBanner` используется во всех точках эскалации.
> - [x] Прогресс Техсовета визуально понятен и обновляется.
> - [x] Флоу подписи нельзя обойти (Bypass-proof).
> - [x] `Override` требует обязательного ввода причины (Reason).
> - [x] Флаг `canSign` корректно влияет на доступность кнопок подписи.

---

## PHASE 4: Risk Triage & Causal Loops [DONE]
**Срок:** Неделя 4  
**Цель:** Слой аналитики рисков и кросс-доменных связей.

### Задачи:
*   **4.1 Risk Stratification (R1–R4) [DONE]:**
    - Визуализация уровней.
    - **R4 (Critical):** Жесткая эскалация, блокировка только связанных действий (не всей системы).
*   **4.2 Triggered Effects Panel:**
    - Отображение: затронутые домены, создаваемые записи, ссылки на объекты.
*   **4.3 Conflict Component:**
    - Явная маркировка (labels), путь эскалации. Запрещен пассивный конфликт (скрытый в логах).

> [!CHECKLIST]
> **Definition of Done (Phase 4):**
> - [x] Уровень риска (R1-R4) виден на каждом десижн-карточке.
> - [x] Авто-эскалация срабатывает при R3/R4.
> - [x] Отрисовывается панель `Triggered Effects`.
> - [x] Конфликты инвариантов визуально выделены и требуют реакции.
> - [x] **Deterministic Guarantee (10/10):** RFC8785 Hashing & Lexicographical BFS.
> - [x] **Institutional Layout (10/10):** Global Sidebar, Persistent Navigation, zero-overlap.

---

## PHASE 5: AI Explainability (Trust & Forensic) [DONE]
**Срок:** Неделя 5 [DONE]
**Цель:** Реализовать 3-уровневое обоснование решений ИИ.

### Задачи:
*   **5.1 ExplainabilityPanel:**
    - **Surface:** Recommendation, Confidence.
    - **Analytical:** Factors, Counterfactual (что если?).
    - **Forensic:** Model version, Ledger link.
*   **5.2 Progressive Disclosure:**
    - Переходы без переключателей (toggles) — только по интенту (клик -> глубже, трейс -> форенсик).

> [!CHECKLIST]
> **Definition of Done (Phase 5):**
> - [x] Нет выводов ИИ без указания `confidence %`. [DONE]
> - [x] Реализован аналитический слой (факторы и контрфактуальный анализ) в UI. [DONE]
> - [x] Каждая рекомендация имеет форензик-слой (модель, хеш, лог). [DONE]
> - [x] Интегрирован `ExplainabilityPanel` в `DecisionsPage`. [DONE]

---

## PHASE 5.1: Infrastructure & Security Hardening (Zero-Trust Fix) [DONE]
**Цель:** Ликвидация технического долга и укрепление типизации.

### Задачи:
*   **Fix 70+ TS Errors [DONE]:** Полный рефакторинг `PrismaService` ($extends), `TenantContextService`.
*   **Integrity Gate Fix [DONE]:** Устранение ошибок типизации в `IntegrityGateService`.
*   **Runtime Stability [DONE]:** Исправление путей `dist` и ESM/CJS конфликтов.

> [!CHECKLIST]
> **Definition of Done (Phase 5.1):**
> - [x] `npm run build` завершается с 0 ошибок.
> - [x] Тесты изоляции тенантов проходят успешно.
> - [x] Сервер запускается в детерминированном окружении.

---

## PHASE 5.2: Navigation Policy Alignment (404 Fix) [DONE]
**Цель:** Приведение фронтенда к стандарту Navigation Policy.

### Задачи:
*   **Navigation Re-org [DONE]:** Перенос страниц в структуру `app/consulting/deviations/...`.
*   **Redirect Logic [DONE]:** Автоматический редирект с корня `/deviations` на `/detected`.

> [!CHECKLIST]
> **Definition of Done (Phase 5.2):**
> - [x] Сайдбар открывает страницы без 404 ошибок.
> - [x] Структура папок совпадает с `navigation-policy.ts`.

---

## PHASE 6: Ledger Integrity & Mismatch Protocol (Safety)
**Срок:** Неделя 6  
**Цель:** Гарантировать институциональную целостность данных в UI.

### Задачи:
*   **6.1 Ledger Sync Watcher:**
    - Сравнение локального хеша состояния с серверным (хеш дерева Меркла).
*   **6.2 Mismatch Handling:**
    - При расхождении: `Global ErrorBoundary`, полная блокировка UI (Freeze), уведомление Risk Officer.

> [!CHECKLIST]
> **Definition of Done (Phase 6):**
> - [x] Ситуация расхождения хешей успешно воспроизводится в тестах.
> - [x] UI блокируется корректно при десинхроне.
> - [x] Отсутствует риск "тихой десинхронизации".
> - [x] Функционал `Trace Replay` (воспроизведение цепи событий) работает.

---

## PHASE 7: Business Domains (Expansion)
**Срок:** Неделя 7+  
**Цель:** Подключение прикладных модулей CRM, Agronomy, Finance, Strategy.

> [!CHECKLIST]
> **Definition of Done (Phase 7):**
> - [x] Прикладные модули интегрированы строго через Governance Core.
> - [x] Кросс-доменные переходы фиксируются в Ledger.

---

## 🔎 Global Institutional Review Checklist

Каждое изменение (PR) проверяется на соответствие:
- [x] **Authority:** Прямые role-check отсутствуют? Все кнопки полномочий активны?
- [x] **Execution:** Используется ли канонический FSM? Видно ли состояние PENDING?
- [x] **Escalation:** Наличие `EscalationBanner`, видимость Техсовета, наличие `escalationId`.
- [x] **Ledger:** Наличие `TraceID`, видимость статуса `Immutable`.
- [x] **AI:** Наличие `Confidence %`, `Counterfactual` и панели обоснования.
- [x] **Risk:** Классификация R1–R4 соблюдена? Включена ли защита от alert fatigue?

---

## 🧪 Обязательные симуляции (Stress Testing)

Каждый спринт завершается прохождением симуляций. Провал любой = **Halt**.

1.  **Role Simulation:** Адаптация интерфейса под `AuthorityContext` (не роли).
2.  **Escalation Simulation:** Искусственный триггер рисков R3/R4, проверка баннеров и Техсовета.
3.  **Ledger Mismatch Simulation:** Симуляция расхождения хешей, проверка блокировки UI.
4.  **Duplicate Action Simulation:** Попытка двойного клика/действия в состоянии `PENDING`.
5.  **Replay Test:** Восстановление состояния UI через воспроизведение цепочки Ledger.

---
*Lead Architecture: Antigravity AI Engine*  
*Status: Institutional Ready (VERIFIED VERSION)*
