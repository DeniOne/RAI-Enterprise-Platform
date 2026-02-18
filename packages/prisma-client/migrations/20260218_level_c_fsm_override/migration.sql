-- Level C: Добавление OVERRIDE_ANALYSIS в enum TechMapStatus
-- Это НЕ-деструктивная миграция (только ADD, не REMOVE/RENAME)

ALTER TYPE "TechMapStatus" ADD VALUE IF NOT EXISTS 'OVERRIDE_ANALYSIS';
