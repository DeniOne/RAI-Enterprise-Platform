---
id: DOC-ARV-AUDIT-DRIFT-REPORT-20260320
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-20
---
# DRIFT REPORT

Дата фиксации: 2026-03-20

| Документ | Что заявляет | Реальность | Разрыв |
|---|---|---|---|
| docs/README.md | Активная стадия и Q2 2025 пилот | Сегодня 2026-03-20; формулировка timeline устарела | timeline drift |
| docs/INDEX.md | Навигация валидна | Встречаются ссылки file:///f:/... и percent-encoded path без декодинга | navigation drift |
| docs/Аудит готовности проекта 2026-03-19.md | lint:docs:matrix = 87 errors | Фактический запуск 2026-03-20: 92 violations | governance baseline drift |
| docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md | Stage2 claims baseline истинности | Не интегрировано в общий DOCS_MATRIX, отсутствует унифицированный claim-контур | claim-system drift |
| docs/01_ARCHITECTURE/DATABASE/*_STATUS.md | Статус фаз DB | Часть файлов без frontmatter и без verified date, автоматические гейты красные | freshness + governance drift |
| docs/INDEX.md | ссылка LEVEL_F_STRATEGY.md | Файл 00_STRATEGY/LEVEL_F_STRATEGY.md отсутствует | broken target drift |
