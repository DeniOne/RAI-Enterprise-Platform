---
id: DOC-ARV-ARCHIVE-A-RAI-AGENT-REGISTRY-PROMPT-P9O4
layer: Archive
type: Legacy
status: archived
version: 0.1.0
---
# A_RAI Agent Registry & Management UI (Phase 4.6)
## Спецификация для кодера (Исполняемый Промпт)

**Контекст:** Реализация подраздела 4.6 из `A_RAI_IMPLEMENTATION_CHECKLIST.md`. Наша цель — создать UI-интерфейс во фронтенде (админка) для управления субагентами роя A_RAI, а также необходимый бекенд для этого. 

---

## 1. БАЗА ДАННЫХ (Prisma Schema Updates)

Текущий `SupervisorAgent` зашит в коде (hardcode). Нам нужна динамика. Добавь в `schema.prisma` следующие модели (соблюдай `Carcass+Flex` стандарт, см. `MEMORY_CANON.md`):

1. **`AgentProfile`** (Сущность самого агента)
   - `id`, `createdAt`, `updatedAt`, `deletedAt`, `version`, `metadata` (flex)
   - `systemName` (String, unique) — внутреннее имя, напр. `agronom_v1`
   - `displayName` (String) — имя для UI
   - `description` (String) — описание для UI
   - `systemPrompt` (String, db.Text) — базовый системный промпт
   - `modelTier` (Enum: `SMART`, `FAST`, `CHEAP`) — дефолтная модель
   - `status` (Enum: `DRAFT`, `ACTIVE`, `DEPRECATED`, `ARCHIVED`)
   - `autonomyLevel` (Enum: `L1_EXPERIMENTAL`, `L2_STABLE`, `L3_TRUSTED`, `L4_AUTONOMOUS`)
   - `baseBsThreshold` (Float) — порог блокировки по % пиздежа (BS%)
   - `budgetLimitMonthly` (Int, nullable) — лимит в центах

2. **`AgentToolMapping`** (Связь Агент ↔ Инструменты из Registry)
   - Связь один-ко-многим или M2M с таблицей агентов.
   - `toolName` (String) — строковое имя тулзы из `AgroToolsRegistry` и др.
   - `isEnabled` (Boolean)
   
3. **`TenantAgentAccess`** (Доступ клиентов к агентам)
   - `tenantId` (String, relation to Tenant/Company)
   - `agentId` (String, relation to AgentProfile)
   - `isAllowed` (Boolean) — разрешен ли этот агент данному клиенту.
   - `customSystemPrompt` (String, nullable) — возможность переопределить промпт для конкретного клиента (опционально).

**Действия кодера:**
- Написать схему.
- Сгенерировать миграцию (`pnpm exec prisma migrate dev...` или `db push` в зависимости от стадии).
- Сделать Zod-схемы/DTO.

---

## 2. BACKEND (API Services & Controllers)

Создать модуль `AgentRegistryModule` (в `apps/api/src/modules/rai-agent-registry/`):

1. **CRUD Контроллер (`agent-registry.controller.ts`)**
   - GET `/agents` (список всех)
   - GET `/agents/:id` (детали)
   - POST `/agents` (создание)
   - PATCH `/agents/:id` (обновление, вкл/выкл)
   - POST `/agents/:id/tools` (назначить/убрать инструмент)

2. **Tenant Access API**
   - GET `/tenant-agents/:tenantId` (какие агенты доступны клиенту)
   - POST `/tenant-agents/:tenantId/:agentId/toggle` (дать/забрать доступ)

3. **Интеграция с `SupervisorAgent`**
   - Обновить `agent-runtime.service.ts`: при старте агента он должен тянуть `systemPrompt` и список разрешенных Tools из БД (`AgentProfile`), а не из констант в коде. ПРОВЕРЯТЬ `TenantAgentAccess`! (Если клиенту агент запрещен — кидать `ForbiddenException`).

---

## 3. FRONTEND UI (Admin Panel)

Создать страницу управления агентами в админке (Next.js / React). Соблюдать **UI Design Canon** (светло, чисто, без жирных шрифтов, только Geist).

### Страница 1: Agent Directory (Список)
- Таблица или грид карточек агентов.
- Колонки/поля: `displayName`, `systemName`, `Status` (Active/Draft), `Tier` (модель), `Autonomy` (L1-L4).
- Кнопка "Создать агента" (+).

### Страница 2: Agent Editor (Редактирование)
- Вкладка **General**: Имя, Описание, Модель (dropdown), Базовый порог BS%.
- Вкладка **Brain**: Большой `textarea` для `systemPrompt`. Должен быть моноширинным (tech).
- Вкладка **Tools**: Checkbox-list всех доступных инструментов (парсить из Backend ключи реестров, напр. `agro.calculateGDD`, `finance.getROI`).
- Вкладка **Tenant Access**: Таблица клиентов консалтинга, свитчеры (on/off) — кому агент доступен.

---

## 4. ОГРАНИЧЕНИЯ И ПРОВЕРКИ (Review Gates)
- **Multi-tenancy:** Эндпоинты управления агентами строго защищены role-based (SuperAdmin/RaiAdmin). Tenant НЕ МОЖЕТ редактировать промпты самого агента.
- **Language Policy:** Весь UI строго на русском языке, кроме системных имен (`systemName`).
- **Data Protection:** Никаких удалений из БД (используем `Status = ARCHIVED` или `deletedAt`).

---

**Команда кодеру:** "Прочти эту спецификацию, создай `interagency/plans/YYYY-MM-DD_agent-registry.md` и переходи к реализации только после ACCEPTED от техлида."
