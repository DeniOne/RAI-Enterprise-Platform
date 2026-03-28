---
id: DOC-ARV-AUDIT-AI-AGENT-FAILURE-SCENARIOS-20260328
layer: Archive
type: Research
status: approved
version: 1.1.0
owners: [@techlead]
last_updated: 2026-03-28
---
# AI / AGENT FAILURE SCENARIOS 2026-03-28

## 1. Итоговый Вердикт

AI/agent контур уже operationally значимый: есть routing, truthfulness, incident ops, explainability, PII masking и human-gated advisory paths. Красный статус routing regression снят, но release baseline остаётся `CONDITIONAL`, потому что safety controls частично разложены по пакетам и ещё не собраны в единый release gate.

## 2. Failure Scenarios

| Сценарий | Trigger | Current safeguard | Observed evidence | Gap | Blast radius | Remediation |
|---|---|---|---|---|---|---|
| `prompt injection` | вредоносный пользовательский input | governed routing, evidence/truthfulness intent | AI docs, incident contours, routing gate PASS | нет unified release eval suite | ответ/route degradation | formal red-team CI gate |
| `tool misuse` | агент получает избыточный tool path | human confirmation и governed runtime intent | autonomy/incident contours, advisory semantics | нет полного tool-permission matrix | incorrect write / abuse | matrix review по tools |
| `secret exfiltration` | secret попадает в trace/log/output | PII masking, incidents, secret scanning | `pnpm gate:secrets` теперь active; tracked findings = 0 | локальные workspace secrets остаются и требуют discipline | критический | rotation + workspace hygiene + central secret storage |
| `memory poisoning` | вредоносный контент в memory/trace/case store | truthfulness/evidence, case-memory tests | routing gate и case-memory baseline PASS | adversarial memory tests не оформлены отдельно | route corruption | dedicated adversarial suite |
| `RAG / corpus poisoning` | недостоверный evidence corpus | evidence-first semantics | evidence-first docs и truthfulness контур есть | нет formal corpus trust model | wrong grounded answer | corpus trust policy + tests |
| `unsafe autonomy` | агент выполняет действие без достаточного gate | human-in-the-loop, autonomy incidents | human confirmation есть в slices | нет доказанного universal policy map | high-impact wrong action | HITL matrix по всем high-impact flows |
| `evidence bypass` | агент отвечает без evidence | truthfulness engine, explicit uncertainty | evidence metrics and tests exist | нет system-wide release threshold | wrong recommendation | release gate on evidence coverage |
| `hallucination governance gap` | confident unsupported answer | truthfulness / BS metrics | truthfulness pipeline реализован | нет полного scorecard thresholding across all agents | false confidence | agent scorecard thresholds |
| `cost explosion` | runaway agent/tool execution | budget incidents, runtime budget | budget/incident path documented | нет unified launch-level cost control report | infra/cost spike | budget dashboards + alerts |
| `human-in-the-loop gap` | write/high-impact path проходит без человека | advisory / confirmation semantics | HITL присутствует в важных slices | нет доказанного universal map | wrong irreversible action | policy map по flows |
| `incident / runbook failure` | incident есть, runbook не срабатывает | incident ops + advisory drills | DR/oncall scripts и ops runbook now present | execution evidence по последнему drill отсутствует | slow containment | регулярные drills + reports |
| `wrong-evidence / no-evidence answer` | empty or weak evidence set | truthfulness engine, explicit uncertainty | tests and uncertainty path exist | нет system-wide launch threshold | advisory trust loss | enforce minimal evidence policy |
| `governance state drift` | docs and runtime расходятся | docs layers + gates | docs governance зелёный, active ops packet added | legal/settings evidence всё ещё partly external | management error | keep code/gates primary truth |

## 3. Наиболее Критичные Runtime Scenarios На Дату Аудита

1. External LLM/provider use без завершённого transborder/legal decision.
2. Local workspace secret hygiene, которая может увести чувствительные значения в traces или support artifacts при неосторожной работе.
3. Отсутствие единого release-gated AI safety eval suite поверх уже существующих разрозненных тестов.
4. Неполная формализация universal HITL matrix для всех high-impact actions.

## 4. Приоритет Закрытия

1. `formal AI safety eval suite`
2. `provider/transborder legal gate for external AI paths`
3. `workspace secret hygiene + rotation`
4. `high-impact flow to HITL matrix`
