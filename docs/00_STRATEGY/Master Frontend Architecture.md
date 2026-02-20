# Master Frontend Architecture (Institutional Grade 10/10)
## RAI-FE-MASTER-ARCH-v1.0

**Статус**: Authoritative Document (Заменяет Strategy и Engineering Blueprint)
**Контекст**: Институциональный уровень управления (Level F)
**Цель**: Единый стандарт реализации Frontend Control Plane.

---

### 1. Архитектурная Парадигма

#### 1.1 Тип системы: Institutional AI Control Plane
Это не дашборд и не ERP. Это операционная поверхность управления AI-системой, где каждое действие — это юридически значимый факт, фиксируемый в Ledger.

#### 1.2 Технологический Стек
*   **Framework**: Next.js (App Router) + Turborepo
*   **Rendering**: Hybrid RSC (Server Components для безопасности и данных, Client Components для интеракции)
*   **State**: React Query (Server State), Zustand (Global UI), XState (Complex Lifecycles/FSM)
*   **Events**: RxJS / Mitt (Global Event Bus)
*   **Security**: mTLS + JWT + Client-side Signature Handshake

#### 1.3 Theming & Dynamic Contrast
Архитектура поддерживает динамическое переключение тем (Light / High-Contrast Dark) для обеспечения читаемости в экстремальных условиях (Contour 2).
*   **Contour 1 (Enterprise)**: Фиксированная светлая тема (`Light Mode`).
*   **Contour 2 (Field)**: Гибридная модель. Поддержка системных предпочтений + ручное переключение.
*   **Implementation**: CSS Variables (используя `tailwind-colors`) + `next-themes` для предотвращения мерцания (hydration mismatch).

##### High-Contrast Dark Mode (Contour 2 Only)
Для работы в кабине техники ночью (Contour 2) темная тема — это вопрос безопасности (предотвращение ослепления).

* **Surface:** `bg-[#0B0C10]` (Глубокий сине-черный).
* **Elevated Surface (Cards):** `bg-[#1A1C23]`.
* **Primary Text:** `text-white/90` (с легким `opacity-90` для снижения «свечения» букв).
* **Muted Text:** `text-[#94A3B8]` (Slate-400).
* **High Contrast Action:** Акцентные цвета (`Emerald-500`, `Indigo-400`) должны иметь коэффициент контрастности не менее 7:1 относительно фона (WCAG AAA).
* **Visual Aid:** Все иконки в темной теме получают микро-свечение (shadow-glow) соответствующего семантического цвета для мгновенного распознавания при тряске.

---

### 2. Структура Навигации (Nav-Tree)

Единая иерархия интерфейса управления:

1.  **УПРАВЛЕНИЕ УРОЖАЕМ**
    *   **Обзор**: Super-Dashboard (Global Consciousness)
    *   **Реестры**: Хозяйства, Контрагенты, Поля, История
    *   **Планы**: Черновики, Активные, Оптимизация (Level B)
    *   **Техкарты**: Проектирование (Level C), Исполнение, Заморозка
    *   **Отклонения**: Triage (Level D), Разбор, Решения
    *   **Эффект**: Анализ план-факт, Performance-оплата

2.  **СТРАТЕГИЯ & ЭКОНОМИКА**
    *   **Стратегия**: Портфель, Карта рисков, Симуляции (Level F)
    *   **Экономика**: Safety Net (Level E), Unit-экономика, Прогнозы

3.  **ФИНАНСЫ & GR**
    *   **Финансы**: Cash Flow, Ledger-логи, CRM-инвойсинг
    *   **GR**: Контракты, Комплаенс, Регуляторный фид

4.  **ЗНАНИЯ & НАСТРОЙКИ**
    *   **Знания**: База паттернов, Эволюция техкарт
    *   **Настройки**: RBAC, Audit Explorer (Merkle Tree), API Gateways

---

### 3. State & Interaction Model

#### 3.1 State Hierarchy
| Layer | Tool | Description |
| :--- | :--- | :--- |
| **Server State** | TanStack Query | Кэширование данных, инвалидация по Tenant/TraceID |
| **UI State** | Zustand | Легковесный стейт сайдбара, модалок и алертов |
| **Flow State** | XState | Жизненные циклы (Plan, TechMap, Deviation, Signature) |
| **Global Sync** | Event Bus | Кросс-модульные уведомления и триггеры |

#### 3.2 Event-Driven Determinism
Все фронтенд-события (например, `DEVIATION_DETECTED`) должны быть детерминированы и логируемы для режима **Audit Mode (Replay)**.

---

### 4. Institutional Governance Layer

#### 4.1 Signature Gateway & mTLS
Любое действие, меняющее состояние системы (Governance Action), проходит через `SignatureGate`:
1.  **Handshake**: Проверка mTLS сертификата.
2.  **Payload**: Формирование пакета для подписи.
3.  **Pre-commit**: Отправка в Ledger-очередь.
4.  **Receipt**: Получение Trace ID и разблокировка UI.

#### 4.2 Ledger Mismatch Protocol
Frontend постоянно сверяет локальные хеши с Ledger. В случае расхождения:
*   **Action**: Полная блокировка UI (Global ErrorBoundary).
*   **Gate**: Требуется вмешательство Risk Officer для сброса кэша и ре-синхронизации.

#### 4.3 Governance Rendering Layer (Action Gating)
UI не использует проверки типа `user.role === 'ADMIN'`. Вместо этого компоненты потребляют `AuthorityContext`:
*   **canOverride**: Разрешение на форсированный переход FSM при конфликте.
*   **canSign**: Доступность функций криптографической подписи.
*   **canEscalate**: Возможность передачи решения на вышестоящий уровень (M-of-N).
*   **canEdit**: Возможность модификации полей в текущем состоянии.

**UI Enforcement (Non-Blocking Escalation)**:
*   *Escalation Awareness*: При блокирующих инвариантах (R3/R4) система не запрещает действие, а переводит UI в режим эскалации (баннеры, метаданные Quorum/TraceID).
*   *Disabled with Reason*: Если действие физически невозможно (напр. Immutable Lock), кнопка обязана иметь тултип с технической причиной.
*   *Override Protocol*: Любой `Override` — это осознанный вход в процедуру повышенного контроля, требующий `Reason` и `Confirmation`.

---

### 5. Component Governance Library

| Component | Ledger-bound | Explainable | Signature-aware |
| :--- | :---: | :---: | :---: |
| `TraceIDBadge` | ✔ | ✖ | ✖ |
| `ExplainabilityPanel` | ✖ | ✔ | ✖ |
| `SignatureGateModal` | ✔ | ✖ | ✔ |
| `OverrideModal` | ✔ | ✔ | ✔ |
| `RiskHeatmap` | ✖ | ✔ | ✖ |
| `IntegrityBadge` | ✔ | ✖ | ✖ |
| `ConflictResolution` | ✔ | ✔ | ✔ |

---

### 6. Multi-Tenant & Security

#### 6.1 Tenant Switch Protocol
Переключение тенанта (агрохолдинга) требует полной очистки памяти фронтенда:
- `queryClient.clear()`
- `eventBus.reset()`
- Websocket/SSE Re-init
- Redirection to `[tenant].rai.com`

#### 6.2 Role-Based Rendering (Capability Matrix)
Доступ определяется матрицей возможностей (Capabilities), а не маршрутами.

| Capability | Agronomist | CFO | Risk Officer | Auditor |
| :--- | :---: | :---: | :---: | :---: |
| **Override** | Limited | ✖ | ✔ | ✖ |
| **View Ledger** | Partial | ✔ | ✔ | Read-only |
| **Sign (M-of-N)** | ✖ | ✔ | ✔ | ✖ |
| **Freeze System**| ✖ | ✖ | ✔ | ✖ |

---

### 7. Performance & Efficiency
- **Data Windowing**: Только виртуализированные таблицы (10k+ строк).
- **Latency**: Интерактивная задержка < 150мс.
- **Background Sync**: Дифференциальное обновление данных через Web Workers.

---

### 8. Definition of Institutional Readiness
Система считается готовой к эксплуатации на уровне Level F, если:
1.  **Traceability**: Все действия привязаны к Trace ID.
2.  **Explainability**: Ни одна рекомендация ИИ не выводится без Explainability-блока.
3.  **Immutability**: Все governance-изменения подписаны и зафиксированы в Ledger.
4.  **Isolation**: Тенант-изоляция доказана на уровне Middleware и Query-ключей.

---
*Lead Architecture: Antigravity AI Engine*