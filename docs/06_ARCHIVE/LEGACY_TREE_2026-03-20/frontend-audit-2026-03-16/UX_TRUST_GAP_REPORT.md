---
id: DOC-ARV-FRONTEND-AUDIT-2026-03-16-UX-TRUST-GAP-REP-1KAU
layer: Archive
type: Research
status: archived
version: 0.1.0
---
# Отчёт по разрыву между UX и продуктовой правдой

Дата: 16.03.2026

## 1. Legacy dashboard остаётся официальной точкой входа

- Пользователь логинится успешно, а затем попадает в зону, где уже есть мёртвые контракты на создание задач.
- Доказательства: `apps/web/components/auth/LoginForm.tsx:51`, `apps/web/app/(app)/telegram-login/page.tsx:64`.
- Почему это разрушает доверие: самый первый пользовательский сценарий направляет в ветку с искажённой реальностью.

## 2. Consulting dashboard обещает реальное время, но показывает демо-сцену

- На странице есть текст про «оперативную сводку ... в реальном времени», а данные собираются из жёстко прошитых значений.
- Доказательства: `apps/web/app/consulting/dashboard/page.tsx:54`, `apps/web/app/consulting/dashboard/page.tsx:135`.

## 3. Advisory визуально выглядит как ядро решений, но является локальным `MOCK_*`

- Экран стилистически оформлен как high-stakes аналитика, но data-source — локальная константа.
- Доказательства: `apps/web/app/consulting/advisory/page.tsx:8`, `apps/web/app/consulting/advisory/page.tsx:18`.

## 4. Budget screen выглядит как живой реестр, хотя backend read-контур отсутствует

- Пользователь видит кнопки управления и статусы, но список не может быть получен с сервера честным способом.
- Доказательства: `apps/web/app/consulting/budgets/page.tsx:10`, `apps/api/src/modules/consulting/consulting.controller.ts:259`.

## 5. Deviations screens имитируют операционную работу с риском

- И `detected`, и `decisions` выглядят как производственные панели, но сидят на локальных массивах.
- Доказательства: `apps/web/app/consulting/deviations/detected/page.tsx:18`, `apps/web/app/consulting/deviations/decisions/page.tsx`.

## 6. Front-office подменяет сбой backend пустым миром

- Пустые списки и нулевые счётчики выглядят как нормальное состояние, хотя это может быть network/server failure.
- Доказательства: `apps/web/app/(app)/front-office/page.tsx:16`, `apps/web/app/(app)/front-office/page.tsx:20`.

## 7. Strategy forecasts может показать локальную тень как серверную правду

- Пользователь видит сценарии даже при ошибке чтения backend, потому что экран падает в `localStorage`.
- Почему это опасно: человек думает, что сервер всё помнит, хотя это уже не так.

## 8. Strategic legal рисует нормативную картину без обращения к legal backend

- Это не просто заглушка. Это имитация authoritative-слоя, где пользователь особенно ждёт достоверность.
- Доказательства: `apps/web/app/(strategic)/legal/page.tsx:7`, `apps/api/src/modules/legal/controllers/legal.controller.ts:20`.

## 9. Массовые placeholder-домены внешне выглядят как готовые разделы платформы

- `41` route-файл показывают `Content Placeholder // Phase Beta`.
- Пользователь тратит время на проверку разделов, которые по сути ещё не существуют.

## 10. Lookup контрагента маскирует отсутствие провайдера по части юрисдикций

- Для BY/KZ backend честно знает, что провайдер не подключён, но UX всё ещё начинается как будто это стандартный рабочий поток.
- Доказательства: `apps/api/src/modules/commerce/services/providers/by-kz-stub.provider.ts:17`, `apps/api/src/modules/commerce/services/providers/by-kz-stub.provider.ts:28`.

## Наиболее затратные ловушки для ручного QA

- Silent catch вместо ошибки: тестировщик видит пустой экран и начинает искать не там.
- Жёсткий `localhost`: один и тот же сценарий меняет поведение от среды к среде.
- `alert(...)`: ошибка не привязана к endpoint, `requestId` и данным запроса.
- `window.location.reload()`: после записи сложно понять, что именно обновилось и что сохранилось.
- Параллельные shell-ы: дефект можно «воспроизвести» только из конкретной точки входа, а из другой он будет скрыт.
