---
id: DOC-ENG-GEN-108
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Advisory Pilot Rollout Policy (Sprint 5)

## Purpose

Определяет правила controlled rollout advisory-пилота для tenant/user scope.

## Rollout Scopes

- Company scope: `pilot/enable` без `targetUserId`.
- User scope: `pilot/cohort/add` с `targetUserId`.

## Eligibility

- Только пользователи с ролью `ADMIN` или `MANAGER` могут управлять pilot.
- Для включения обязателен `traceId`.

## Rollout Sequence

1. Enable pilot for limited cohort (user scope).
2. Monitor 24h metrics (`ops/metrics`).
3. Expand to company scope только при стабильном accept/reject профиле.

## Rollback

- User-level rollback: `pilot/cohort/remove`.
- Tenant-level rollback: `pilot/disable`.
- Global emergency rollback: `incident/kill-switch/enable`.

## Audit Requirements

Каждое действие rollout фиксируется в аудите:
- `ADVISORY_PILOT_ENABLED`
- `ADVISORY_PILOT_DISABLED`

Обязательные metadata:
- `traceId`, `companyId`, `scope`, `targetUserId` (если scope=`USER`).
