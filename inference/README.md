# Inference Service Shell (Sprint 1)

## Что делает сейчас
- Поднимает FastAPI сервис.
- Отдает health-check на `GET /health`.
- Принимает запрос на `POST /infer`.
- Генерирует или принимает `trace_id`.
- Пишет структурные JSON логи (trace_id, request_id, timestamp).
- Возвращает заглушку без выполнения inference.

## Чего НЕ делает
- Не выполняет inference, ML, загрузку моделей.
- Не применяет бизнес-логику.
- Не подключается к БД или внешним API.
- Не интегрируется с Risk Engine.
- Не выполняет валидацию схемы входа (только TODO).

## Запуск локально
- Установить зависимости: `pip install -r requirements.txt`
- Запуск: `uvicorn app.main:app --host 0.0.0.0 --port 8000`

## TODO для Sprint 2
- Валидация входа по JSON Schema.
- Загрузка модели/моделей.
- Интеграция с Risk Engine (read-only).
- Метрики и SLO.
