---
id: DOC-ARV-AUDIT-AI-AGENT-FAILURE-SCENARIOS-20260328
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
---
# AI / AGENT FAILURE SCENARIOS 2026-03-28

## 1. Итоговый Вердикт

AI/agent контур уже не декоративный: есть routing, truthfulness, incident ops, explainability, PII masking и human-gated advisory paths. Но release baseline красный, потому что routing regression и неполный safety control pack подрывают доверие к governed runtime.

## 2. Failure Scenarios

| Сценарий | Trigger | Current safeguard | Observed evidence | Gap | Blast radius | Remediation |
|---|---|---|---|---|---|---|
| `prompt injection` | вредоносный пользовательский input | governed routing, evidence/truthfulness intent, red-team traces | есть `privacy-red-team` report и AI docs | нет unified blocking eval gate в release baseline | ответ/route degradation | formal red-team CI gate |
| `tool misuse` | агент получает избыточный tool path | human confirmation и governed runtime intent | в docs и runtime есть autonomy/incident contours | нет доказанного full coverage по всем tools | incorrect write / abuse | matrix tool-permission review |
| `secret exfiltration` | secret попадает в trace/log/output | PII masking, incidents | PII masking есть, secret-specific scanning не подтверждён | нет secret scanning + tracked `ca.key` | критический | secret scanning + repo purge + rotation |
| `memory poisoning` | вредоносный контент в memory/trace/case store | truthfulness/evidence, case memory | routing-case-memory tests падают | memory lifecycle regression уже подтверждён | route corruption | fix case-memory + add adversarial tests |
| `RAG / corpus poisoning` | недостоверный evidence corpus | knowledge/evidence-first semantics | evidence-first docs есть | нет formal corpus trust model | wrong grounded answer | corpus trust policy + source ranking tests |
| `unsafe autonomy` | агент выполняет действие без достаточного gate | human-in-the-loop, autonomy incidents, runbooks | autonomy/policy incidents implemented | coverage не доказана как full-system | high-impact wrong action | autonomy policy eval suite |
| `evidence bypass` | агент отвечает без evidence | truthfulness engine, evidence sections | evidence metrics and tests exist | routing/test regressions снижают доверие | wrong recommendation | release gate on evidence coverage |
| `hallucination governance gap` | confident unsupported answer | truthfulness / BS metrics | evidence/truthfulness контур реализован | нет complete go/no-go thresholding across all agents | false confidence | agent scorecard thresholds + release blocking |
| `cost explosion` | runaway agent/tool execution | budget incidents, runtime budget | budget incident path documented in `interagency` | нет unified cost control audit in launch packet | infra/cost spike | cost evals + budget dashboards in release pack |
| `human-in-the-loop gap` | write/high-impact path проходит без человека | advisory / confirmation docs and runtime semantics | human confirmation присутствует в slices | нет доказанного universal policy map | wrong irreversible action | map all high-impact flows to mandatory HITL |
| `incident / runbook failure` | incident есть, runbook не срабатывает | incident ops + runbook execution | incidents/runbooks implemented | нет full ops rehearsal pack for whole platform | slow containment | regular drills + ops packet |
| `routing degradation` | classifier возвращает лишний slice | routing gates | `gate:routing:primary-slices` FAIL | уже подтверждён красный regression | misroute, wrong agent, wrong tool | fix routing before pilot |
| `wrong-evidence / no-evidence answer` | empty or weak evidence set | truthfulness engine, explicit uncertainty | tests for no-evidence/pending quality exist | нет system-wide enforced launch threshold | advisory trust loss | enforce minimal evidence policy |
| `governance state drift` | docs and runtime расходятся | docs layers + gates | prior docs-only baseline already warned about drift | still true for runtime/legal pack | management error | keep code/gates as primary truth and version audit packet |

## 3. Наиболее Критичные Runtime Scenarios На Дату Аудита

1. Routing regression already live in gate corpus.
2. Case-memory lifecycle regression already live in tests.
3. Secret hygiene failure already visible via tracked key material.
4. AI safety controls есть, но они не собраны в единый release gate.

## 4. Приоритет Закрытия

1. `routing + case-memory`
2. `secret hygiene + scanning`
3. `formal AI safety eval suite`
4. `high-impact flow to HITL matrix`
