---
id: DOC-ARC-DECISIONS-ADR-DB-004-READ-MODELS-PROJECTIONS
layer: Architecture
type: ADR
status: proposed
version: 0.1.0
owners: [@techlead, @backend-lead, @data-architecture]
last_updated: 2026-03-13
---
# ADR_DB_004: Read Models and Projections Policy

## Статус
`Proposed` (Phase 0 governance)

## Контекст

Cross-domain чтения через deep include-графы нестабильны и дороги.
При этом uncontrolled projections создают второй неуправляемый слой данных.

## Решение

Projection/read model создается только если выполняется хотя бы одно:
- тяжелое cross-domain чтение;
- стабильный UI/workspace use-case;
- повторяющийся аналитический/операционный view.

Для каждой projection обязательны:
- owner;
- source of truth;
- refresh SLA;
- refresh mechanism;
- deterministic rebuild contract;
- retention и consumers.

Read model не может быть source of truth.

## Последствия

Плюсы:
- сокращается сложность runtime query graph;
- контролируется рост projection слоя;
- легче масштабируются workspace сценарии.

Минусы:
- нужен отдельный lifecycle projections;
- дополнительные проверки в review и CI.

## Guardrails

- ad hoc projection tables без owner/rebuild contract запрещены;
- projection writes как business source запрещены;
- каждый projection use-case должен быть связан с policy метаданными.

## Verification

- `READ_MODEL_POLICY.md` заполнен и применяется;
- CI/ревью отклоняет projection без metadata contract.
