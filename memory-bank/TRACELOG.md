[2026-03-05 23:59Z] R3 Truthfulness Runtime Trigger
- Решена гонка `writeAiAuditEntry` vs `calculateTraceTruthfulness` (добавлен await).
- Удален фальшивый fallback `bsScorePct ?? 0` (заменен на честные 100).
- Зафиксирована семантика _replayMode_ -> truthfulness pipeline skipping.
- Написано 5 тестов `Truthfulness runtime pipeline`.
[2026-03-05 00:13Z] R3 Truthfulness - Revision A
- Исправлена гонка traceSummary.record -> updateQuality (добавлен await перед record).
- Тест ordering доработан проверкой record -> audit -> updateQuality.
- Семантика replayMode стала честным read-only: отключены record и auditCreateSideEffects.
