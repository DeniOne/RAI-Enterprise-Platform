---
id: DOC-AI-SYSTEM-RAI-EP-AI-GOVERNANCE-AUTONOMY-POLICY-20260328
layer: Engineering
type: Policy
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-AI-RAI-EP-AI-GOVERNANCE-AUTONOMY-POLICY-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: docs/_audit/AI_AGENT_FAILURE_SCENARIOS_2026-03-28.md;apps/api/src/shared/rai-chat;apps/api/src/modules/explainability;apps/api/src/modules/rai-chat
---
# RAI_EP AI GOVERNANCE AND AUTONOMY POLICY

## CLAIM
id: CLAIM-AI-RAI-EP-AI-GOVERNANCE-AUTONOMY-POLICY-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Базовый принцип

AI в `RAI_EP` — это governed advisory and orchestration layer.

Он не является суверенным центром принятия high-impact решений и не может обходить policy, evidence requirements, tool restrictions и human confirmation.

## Что AI разрешено

- классифицировать и маршрутизировать запросы;
- собирать и кратко структурировать контекст;
- формировать draft-ответы и рекомендации;
- объяснять логику рекомендации;
- помогать в анализе отклонений, рисков и вариантов действий;
- запускать допустимые low-risk tool flows в пределах allowlist.

## Что AI запрещено без отдельного human gate

- запускать необратимые write actions;
- менять критичные состояния техкарты;
- отправлять юридически, финансово или репутационно значимые внешние сообщения;
- подтверждать факты без достаточного evidence;
- использовать tools вне route-specific permission matrix;
- выполнять high-impact действия без logging и explainability.

## Обязательные policy blocks

### Tool-permission matrix
Для каждого route class должен существовать допустимый набор инструментов.

### HITL matrix
Для каждого класса high-impact действия должен быть определён обязательный human confirmation rule.

### Evidence policy
Система не должна выдавать уверенный ответ при недостаточной доказательной базе.

### Uncertainty policy
При неполной информации система обязана явно обозначать ограниченность вывода.

### Incident policy
Любой evidence bypass, unsafe autonomy, tool misuse, PII leak, wrong-evidence answer или policy drift должен оставлять incident record.

## Release criteria для AI

AI runtime нельзя считать release-ready, пока не выполнены все условия:
- есть formal safety eval suite;
- есть regression coverage по основным agent/routing slices;
- есть tool matrix;
- есть HITL matrix;
- есть incident review cadence;
- есть scorecards по truthfulness, evidence и unsafe actions.

## Уровни автономии

### Level A — read/advisory only
AI читает, анализирует, предлагает, но ничего критичного не меняет.

### Level B — bounded operational assistance
AI может инициировать ограниченные low-risk действия в рамках жёсткого allowlist и логирования.

### Level C — high-impact execution
Для `RAI_EP` такой уровень допустим только как исключение при отдельной политике и доказанной зрелости, а не как режим по умолчанию.

## Метрики управления AI

- evidence coverage rate;
- uncertainty correctness rate;
- unsupported answer rate;
- blocked unsafe action rate;
- policy violation rate;
- incident closure time;
- cost per successful governed task.

## Главный запрет

Нельзя развивать агентность быстрее, чем формализуются policy, release gates, legal boundaries и enterprise-контроль. Иначе продукт будет расти как демонстрация AI, а не как управляемая система.
