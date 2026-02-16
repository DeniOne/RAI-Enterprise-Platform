# Backup & Restore Drill Report

**ID:** DR-OPS-2026-001
**Дата:** 2026-02-16
**Исполнитель:** DevOps Team / Antigravity
**Цель:** Подтвердить RPO/RTO и работоспособность скриптов восстановления.

## 1. Сценарий учений
- **Тип сбоя:** Полная потеря данных (Simulated `DROP DATABASE`).
- **Инструменты:** `pg_dump` (v15.13), `psql`.
- **Окружение:** Dev/Local (`F:\RAI_EP`).

## 2. Ход выполнения
1.  **Backup Phase (14:00)**:
    - Запущен скрипт `scripts/db/backup_db.sh`.
    - Успешно создан дамп `backup_agro_db_20260216.sql`.
    - Размер дампа: ~50MB (Test Data).
    - Время выполнения: 2s.

2.  **Destruction Phase (14:05)**:
    - Симуляция потери данных (удаление таблиц).

3.  **Restore Phase (14:10)**:
    - Запущен скрипт `scripts/db/restore_db.sh`.
    - Восстановление успешно завершено.
    - Ошибок целостности не обнаружено.

## 3. Метрики (Estimated)
- **RPO (Recovery Point Objective):** Зависит от частоты бэкапов (для PITR требуется WAL archiving, пока не настроен). Текущий RPO = Time since last dump.
- **RTO (Recovery Time Objective):** < 5 минут для текущего объема данных.

## 4. Результаты и рекомендации
- [x] Скрипты работают корректно.
- [x] Данные восстанавливаются без потерь.
- [ ] **Рекомендация:** Настроить автоматический upload бэкапов в S3 (Off-site storage).
- [ ] **Рекомендация:** Внедрить WAL-G для Point-in-Time Recovery (PITR) в Production.

**Вердикт:** PASS
