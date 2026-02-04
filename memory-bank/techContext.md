# Tech Context: RAI_EP

## Stack
- **Backend Core**: TypeScript, Node.js (на базе BusinessCore).
- **Database**: PostgreSQL (через Prisma ORM).
- **Architecture**: Domain-Driven Design (DDD) + Clean Architecture principles.
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
