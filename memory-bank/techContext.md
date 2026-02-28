# Tech Context: RAI_EP

## Stack
- **Backend Core**: TypeScript, Node.js (на базе BusinessCore).
- **Database**: PostgreSQL (через Prisma ORM).
- **Architecture**: Domain-Driven Design (DDD) + Clean Architecture principles.
- **Modules**: `TaskModule`, `AgroOrchestratorModule`, `TechMapModule`, `CmrModule`, `HrModule`, `FinanceEconomyModule`
 - **Key Services**: `TaskService`, `AgroOrchestratorService`, `EconomyService`, `FinanceService`, `BudgetService`
- **Interfaces**: 
  - Telegram Bot API (Standalone Microservice: `apps/telegram-bot`).
  - NestJS (Backend API: `apps/api`).
  - Next.js (Web Dashboard: `apps/web`).
- **Auth Flow**: 
  - JWT-based 2FA via Telegram (Polling Session Model).
  - Cross-domain auth via `auth_token` cookies.

## Infrastructure
- **Deployment**: Docker-compose (локально/стейджинг).
- **Documentation**: Markdown-based Canon.
- **Agent Environment**: Antigravity IDE (Windows).

## Global Rules
- **Formatting**: Git-style markdown.
- **Language Policy**: Russian (mandatory) + expressive vocabulary.
- **UI Density Canon**: Приоритет плотности данных над пустотой. Использование `text-[9px]` для метаданных, минимизация `py/px`, обязательное поднятие важного контента выше линии сгиба.
- **Terminology Rule**: Запрет на "тяжелый" банковский жаргон. Термины должны быть понятны операционным менеджерам (СБ, Реестр, Проверка).

## Data Consistency & Isolation
- **Tenant Isolation (10/10)**: 
  - Реализована на уровне `PrismaService` через `$extends` и прозрачный `Proxy`.
  - Все запросы к `tenantScopedModels` (например, `agroEventDraft`) автоматически фильтруются по `companyId` из контекста.
  - Поле `companyId` является обязательным для всех моделей, требующих изоляции.
  - Прямой доступ к нефильтрованным данным разрешен только через флаг `isSystem` в контексте.
- **Client Generation**:
  - Каноническая генерация клиента: `pnpm db:client` из корня.
  - Все модели автоматически типизированы и доступны через `this.prisma.<modelName>`.
