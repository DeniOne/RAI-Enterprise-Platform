---
id: DOC-EXE-07-AGENT-TRACE-SMOKE-LOG-2026-03-13
layer: Execution
type: Verification Log
status: in_progress
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-13
---

# Agent Trace Smoke Log (2026-03-13)

Источник сценариев:
- `docs/07_EXECUTION/AGENT_RUNTIME_UI_CHECKLIST.md`

## Результаты прогона

| Агент               | Экран вызова        | Endpoint             | Trace ID | Forensics check | Статус | Комментарий |
|---               |---                  |---                  |---      |---              |---       |---        |
| `agronomist`     | AI Dock             | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `economist`      | AI Dock             | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `knowledge`      | AI Dock             | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `monitoring`     | AI Dock             | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `crm_agent`       | AI Dock / Front Office | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `front_office_agent` | AI Dock / Front Office | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `contracts_agent` | AI Dock | `POST /api/rai/chat` | `PENDING` | `PENDING` | `PENDING` |  |
| `chief_agronomist` | CTA из сущности + AI Dock action | `POST /rai-chat/expert/chief-agronomist/review` | `PENDING` | `PENDING` | `PENDING` |  |
| `data_scientist` | `Стратегия -> Прогнозы` | `POST /ofs/strategy/forecasts/run` | `PENDING` | `PENDING` | `PENDING` |  |

## Протокол фиксации

1. Выполнить сценарий в UI.
2. Сохранить `traceId` из ответа/карточки.
3. Открыть `/control-tower/trace/:traceId`.
4. Проверить `forensics` + `topology`.
5. Зафиксировать результат в таблице.
