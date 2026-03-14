---
id: DOC-EXE-07-AGENT-RUNTIME-UI-CHECKLIST
layer: Execution
type: Checklist
status: in_progress
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-13
---

# Чек-лист агентов: экран вызова, endpoint, trace

## 1. Цель

Единый операционный чек-лист для проверки связки:
- UI-кнопка/окно
- backend endpoint
- trace-артефакт в Control Tower / Forensics

Эффект применения: ускоряется диагностика нерабочих кнопок, быстрее локализуются разрывы UI -> API -> trace.

## 2. Общие правила проверки

1. Запускать сценарий под ролью `ADMIN` или `FOUNDER`.
2. Проверять не только HTTP 200, но и появление trace в форензике.
3. Для high-impact действий фиксировать outcome через audit trail.
4. Ошибки в UI должны показываться в интерфейсе, без browser `alert`.

## 3. Матрица по агентам проекта

| Агент | Где вызывается в UI | Endpoint | Какой trace должен появиться | Быстрая проверка |
|---|---|---|---|---|
| `agronomist` | AI Dock (`/control-tower`, левая панель чата), техкарты/агро запросы | `POST /api/rai/chat` | Trace с узлом роли `agronomist` в топологии трассы | Отправить агро-запрос -> открыть `/control-tower` -> перейти в `Разбор трассы` |
| `economist` | AI Dock, экономические/план-факт запросы | `POST /api/rai/chat` | Trace с узлом `economist`, evidence по экономическим данным | Отправить экономический запрос -> сверить trace в `forensics` |
| `knowledge` | AI Dock, запросы по базе знаний/регламентам | `POST /api/rai/chat` | Trace с retrieval-узлами и evidence-ссылками | Запросить справку/регламент -> проверить блок `Доказательства` |
| `monitoring` | AI Dock и сигналы/алармы (контекстные действия) | `POST /api/rai/chat` | Trace с fallback/alert-веткой, запись в runtime governance drilldowns | Сгенерировать запрос по отклонению -> проверить `Control Tower -> Runtime Governance` |
| `crm_agent` | AI Dock (CRM-интенты), Front Office контекст | `POST /api/rai/chat` | Trace с CRM-инструментами и ссылкой на сущность | Команда на CRM-действие -> trace + изменение в CRM-экране |
| `front_office_agent` | AI Dock (front-office интенты), Front Office workspace | `POST /api/rai/chat` | Trace с узлом `front_office_agent`, при write — pending action/audit | Выполнить front-office команду -> проверить pending actions и trace |
| `contracts_agent` | AI Dock, контрактные/документные сценарии | `POST /api/rai/chat` | Trace с контрактными инструментами + evidence | Сценарий по договору -> проверка trace topology/evidence |
| `chief_agronomist` | CTA из сущности (`техкарта`, `deviation`, `field`) и suggested action из AI Dock | `POST /rai-chat/expert/chief-agronomist/review` | `traceId` в ответе review + форензика по trace | Нажать `Эскалировать к Мега-Агрономy` -> получить review -> открыть trace |
| `data_scientist` | `Стратегия -> Прогнозы` (MVP), плюс аналитический слой из AI | `POST /ofs/strategy/forecasts/run` | Явный `traceId` в ответе прогноза, lineage/range/evidence | Запустить прогноз -> trace в карточке `Рекомендация` -> открыть forensics |

## 4. Проверка экранов и кнопок (обязательный проход)

### 4.1 AI Dock

- Кнопка отправки сообщения активна только при непустом тексте.
- В ответе показывается одна строка `Почему этот ответ?` (без raw memory internals).
- Suggested actions: максимум 3.
- При экспертной эскалации открывается встроенная панель, не browser prompt.

Ожидаемый эффект: AI-поток предсказуемый, без перегруза и без скрытых модальных ошибок.

### 4.2 Экспертная эскалация (`chief_agronomist`)

- CTA виден из контекста сущности (техкарта/отклонение/поле).
- В drawer доступны действия: `Принять`, `Передать человеку`, `Создать задачу`.
- Комментарий к решению вводится в поле панели (не `window.prompt`).
- После действия фиксируется итог (`outcomeAction`, `resolvedAt`, `createdTaskId` при создании задачи).

Ожидаемый эффект: экспертный контур становится воспроизводимым и аудируемым.

### 4.3 Control Tower -> Реестр агентов

- Кнопка `Создать запрос на изменение` открывает форму без падения 500 на повторной отправке.
- Ошибки отображаются как UI-ошибки в форме, а не сырое `Request failed ...`.
- Секции `Политика памяти / Контракт ответа / Политика управления` раскрываются по требованию.

Ожидаемый эффект: конфигурация агентов проходит стабильный governance-flow.

### 4.4 Стратегия -> Прогнозы

- `Построить прогноз` недоступна без `Сезона`.
- После запуска есть `traceId`, `baseline/range/scenario delta/risk/recommendation`.
- История запусков и запись факта выполняются без блокировки всего экрана.

Ожидаемый эффект: deterministic forecasting flow проверяем end-to-end.

## 5. API и trace контрольные точки

- Chat ingress: `POST /api/rai/chat`.
- Expert review: `POST /rai-chat/expert/chief-agronomist/review`.
- Expert outcome: `POST /rai-chat/expert/reviews/:reviewId/outcome`.
- Forecast run: `POST /ofs/strategy/forecasts/run`.
- Forensics: `GET /rai/explainability/trace/:traceId/forensics`.
- Topology: `GET /rai/explainability/trace/:traceId/topology`.

## 6. Критерии “готово”

- Для каждой роли из матрицы есть рабочий UI-вход и успешный endpoint вызов.
- Для каждого high-impact потока фиксируется trace и доступен форензике.
- Пользовательский текст в agent-поверхностях соответствует `LANGUAGE_POLICY.md`.
- В рабочих экранах нет длинных поясняющих плашек, контекст даётся через локальные подсказки.

## 7. Статус выполнения (2026-03-13)

- Выполнено: `control-tower` и `strategy/forecasts` переведены с browser `prompt/alert` на встроенные диалоги и inline-ошибки.
- Выполнено: экспертные outcome-действия в AI Dock и drawer работают через текстовое поле комментария в панели.
- Выполнено: базовая русификация пользовательских сообщений в agent-контуре (`control-tower`, `agents`, `trace`, `forecasts`) доведена до рабочего уровня.
- Выполнено: автоматические тесты по затронутым экранам проходят (`strategy-forecasts`, `control-tower`, `chief-agronomist drawer`).
- Следующее действие: прогнать ручной smoke по матрице агентов из раздела 3 и зафиксировать trace-пруфы по каждой роли.
- Ожидаемый эффект: подтверждённая end-to-end связка UI -> endpoint -> trace, без ложных “зелёных” кнопок.
