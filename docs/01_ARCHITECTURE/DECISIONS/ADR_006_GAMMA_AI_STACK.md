---
id: DOC-ARC-GEN-031
type: HLD
layer: Architecture
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿---
id: decision-adr-006-gamma-ai-stack
type: decision
status: review
owners: [architects]
aligned_with: [principle-ai-governance-canon]
---

# ADR 006: Стек Gamma для AI и MLOps

## Контекст
Необходим надежный контур для инференса, версионирования и контроля качества AI-моделей в реальном производстве.

## Решение
- Слой инференса и MLOps базируется на контейнерах (Docker/Kubernetes).
- Использование Shadow mode (параллельный прогон на реальных данных без воздействия) и Canary rollout.

## Преимущества
- Высокая скорость внедрения обновлений.
- Стабильность и откат моделей при деградации.

## Компромиссы
- Повышение сложности управления инфраструктурой.
- Необходимость строгой типизации всех агро-данных (Data Contracts).
