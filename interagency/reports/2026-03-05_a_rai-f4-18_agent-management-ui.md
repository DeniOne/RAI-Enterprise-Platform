# Отчёт — Agent Registry & Configurator UI (F4.18)

**Промт:** `interagency/prompts/2026-03-05_a_rai-f4-18_agent-management-ui.md`  
**Дата:** 2026-03-05  
**Статус:** READY_FOR_REVIEW

## Изменённые / добавленные файлы

### Web
- `apps/web/lib/api.ts` — блок `api.agents`: getConfig(), upsertConfig(data, scope), toggle(role, isActive); типы AgentConfigItem, UpsertAgentConfigBody.
- `apps/web/app/(app)/control-tower/page.tsx` — ссылка «Реестр агентов» на `/control-tower/agents`.
- `apps/web/app/(app)/control-tower/agents/page.tsx` — страница Agent Registry: список агентов (глобальные + tenant overrides), индикация «Глобальный»/«Тенант», переключатель isActive, кнопка «Редактировать»; модальный редактор (System Prompt — textarea моноширинный, выбор модели, maxTokens, capabilities multiselect, область tenant/global); кнопка «Добавить переопределение» (createMode с выбором роли из agronomist, economist, knowledge, monitoring).

## Реализовано

- **Список агентов (Agent Registry):** таблица-карточки по ролям; статус Active/Inactive (checkbox), роль, модель; бейджи «Глобальный» / «Тенант»; быстрый toggle isActive через PATCH /rai/agents/config/toggle.
- **Редактор конфигурации:** форма с полями name, systemPrompt (textarea, font-mono), llmModel (select: GPT-4o, GPT-4o-mini, Claude-3.5-Sonnet, Claude-3-Opus), maxTokens, capabilities (мультиселект Agro/Finance/Risk/KnowledgeToolsRegistry), область (tenant | global). Сохранение через POST /rai/agents/config?scope=.
- **Tenant Overrides:** создание переопределения по кнопке «Добавить переопределение» (выбор role из известного списка); в списке отображаются и глобальные конфиги, и переопределения тенанта с явной индикацией.
- **Стек:** тот же, что F4.17 — Next.js, Tailwind, zinc-950; Card, Button из @/components/ui.

## Результаты проверок

### tsc
- `apps/api`: PASS  
- `apps/web`: PASS  

### jest
- `apps/api` (agent-management, explainability): 42 tests PASS  

## DoD

- [x] Полный цикл CRUD для настроек агентов через UI (GET config, POST upsert, PATCH toggle).
- [x] Tenant isolation: companyId из контекста (JWT), не из payload; API /rai/agents/* под JwtAuthGuard + RolesGuard ADMIN.
- [x] Сборка веба: `pnpm exec tsc --noEmit` в apps/web проходит.

## UI (кратко)

- **Реестр:** блок с карточками по каждой записи (global + tenantOverrides); в каждой: имя, роль, бейдж области, модель, кнопки «Редактировать» и чекбокс «Вкл».
- **Редактор (модалка):** заголовок «Редактировать: &lt;role&gt;» или «Новое переопределение»; поля формы; при создании — выбор роли из выпадающего списка; при редактировании — выбор области (тенант/глобальный). Сохранить / Отмена.
