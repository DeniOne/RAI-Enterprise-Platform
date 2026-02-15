---
id: DOC-ENG-GEN-118
type: Service Spec
layer: Engineering
status: Draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-02-15
---

﻿# Advisory Tuning Policy (Sprint 5)

## Purpose

Политика управления порогами advisory-решений:
- `confidenceReview`
- `blockScore`
- `allowScore`

## Default Thresholds

- `confidenceReview = 0.45`
- `blockScore = -0.35`
- `allowScore = 0.35`

## Update Procedure

1. Сбор метрик за окно не менее 24 часов (`ops/metrics`).
2. Подготовка нового профиля порогов.
3. Применение через `POST /api/advisory/tuning/thresholds` с `traceId`.
4. Мониторинг после изменения (минимум 2 часа).

## Constraints

- `confidenceReview` ∈ [0..1]
- `blockScore < allowScore`
- Изменения доступны только ролям `ADMIN`/`MANAGER`

## Audit Requirements

- Событие: `ADVISORY_TUNING_UPDATED`
- Обязательные поля: `traceId`, `companyId`, `thresholds`, `actor`.

## Rollback

Откат выполняется повторным применением последнего стабильного набора порогов.
