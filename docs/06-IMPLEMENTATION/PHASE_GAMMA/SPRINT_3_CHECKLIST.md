# Чек-лист Sprint 3 (Phase Gamma)

**Название:** «Когнитивная память (Уроки прошлого)»
**Срок:** 2 недели
**Статус:** завершен (08.02.2026)
**Цель:** включить эпизодическую память и теневой контур рекомендаций без воздействия на прод-решения.

## Объем Sprint 3
- [x] **Episodic Retrieval API:** базовый retrieval-сервис по `memory_entries` реализован, unit-тесты добавлены.
- [x] **Positive/Negative Engrams:** правила разметки исходов реализованы (`engram-rules` + unit-тесты).
- [x] **Advisory Logic (Shadow):** реализован `ShadowAdvisoryService` с ранжированием `ALLOW/REVIEW/BLOCK`.
- [x] **Shadow Mode:** расчет рекомендаций выполняется в сервисе без пользовательской публикации.
- [x] **Traceability:** `traceId` проходит через retrieval и advisory.
- [x] **Audit Trail:** каждый теневой вердикт логируется через `AuditService` (`SHADOW_ADVISORY_EVALUATED`).

## Критерии готовности (DoD)
- [x] Retrieval/Shadow подключены к 3 базовым сценариям сигналов: болезни (Vision), спутник (Satellite), операция (FieldObservation).
- [x] Все теневые рекомендации сохраняются в журнале с explainability-полями.
- [x] Нет пользовательских побочных эффектов: UI и бизнес-решения не меняются.
- [x] Минимум 3 unit-теста на модуль памяти/ранжирования проходят стабильно.
- [x] Обновлена документация по контрактам данных и полям explainability (`docs/04-ENGINEERING/SHADOW_ADVISORY_CONTRACT.md`).

## Anti-Goals Sprint 3
- [x] Нет прод-публикации рекомендаций пользователю.
- [x] Нет автоматического принятия решений без `human-in-the-loop`.
- [x] Нет расширения доменного скоупа вне Gamma Integration.

## Артефакты на выходе
- [x] `Episodic Retrieval` сервис + тесты.
- [x] Правила и формат `engrams` (код + unit-тесты).
- [x] Shadow-интеграция в ingestion: `VisionIngestionService` и `SatelliteIngestionService`.
- [x] Shadow-интеграция в operation-сигналы: `FieldObservationService`.
- [x] Теневой отчет по качеству рекомендаций: реализован `ShadowAdvisoryMetricsService` (coverage/ratios/confidence).
- [x] Обновленные чек-листы фазы Gamma.
