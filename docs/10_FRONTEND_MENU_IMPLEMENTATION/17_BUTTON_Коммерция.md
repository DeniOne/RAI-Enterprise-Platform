# 17. Кнопка/Экран: Коммерция

## 0. Статус производства кнопки/экрана
- Stage: `DONE`
- Готовность: `100%`
- Дата последнего обновления: `2026-02-24`
- Следующий milestone: UI-формы полного бизнес-цикла (создание/постинг/аллокация)

## 1. Название кнопки/экрана и бизнес-роль
- Название: `Коммерция`
- Бизнес-роль: единая точка входа в операционный контур Contract -> Fulfillment -> Invoice -> Payment для коммерческих операций холдинга.

## 2. Целевые маршруты (основной + подмаршруты)
- Основной вход: `/commerce` (редирект на `/commerce/contracts`)
- Подмаршруты:
  - `/commerce/contracts`
  - `/commerce/fulfillment`
  - `/commerce/invoices`
  - `/commerce/payments`

## 3. Поведение при нажатии (куда ведет, что видит пользователь)
- Нажатие на пункт меню `Коммерция` открывает `/commerce/contracts`.
- Пользователь видит каноничный light-layout с заголовком раздела и карточкой-заглушкой.
- Переход между подэкранами выполняется через SPA-навигацию без полной перезагрузки.

## 4. UI/UX-сценарий
- loading:
  - На всех `/commerce/*` экранах реализовано состояние загрузки данных.
- empty:
  - Для `/commerce/contracts` выводится сообщение `Договоры пока не созданы`.
  - Для `/commerce/fulfillment` выводится сообщение `События исполнения пока не зафиксированы`.
  - Для `/commerce/invoices` выводится сообщение `Документы пока не сформированы`.
  - Для `/commerce/payments` выводится сообщение `Оплаты пока не зафиксированы`.
- error:
  - На `/commerce/contracts` есть error-state с retry-действием.
  - На `/commerce/fulfillment` есть error-state с retry-действием.
  - На `/commerce/invoices` и `/commerce/payments` есть error-state с retry-действием.
- permission:
  - Доступ ограничен ролевой политикой в navigation-policy.
  - Недоступные роли не видят пункт `Коммерция` в sidebar.

## 5. Кликабельность блоков и действия, пути переходов
- Sidebar root:
  - `Коммерция` -> `/commerce/contracts`
- Подпункты:
  - `Договоры` -> `/commerce/contracts`
  - `Исполнение договоров` -> `/commerce/fulfillment`
  - `Документы` -> `/commerce/invoices`
  - `Оплаты` -> `/commerce/payments`

## 6. Smart routing контракт (`entity`/`severity`, подсветка, авто-скролл)
- Реализованный контракт:
  - query-параметр `entity=<id|number|name>` для фокуса на сущности (по экрану)
  - query-параметр `severity=<ok|warning|critical>` для фильтрации статусов/типов событий
  - авто-скролл к целевой строке и подсветка `data-focus=true` на `/commerce/contracts`, `/commerce/fulfillment`, `/commerce/invoices`, `/commerce/payments`

## 7. API-связки (какие endpoint используются)
- Текущий MVP: подключены все базовые read endpoint:
  - `GET /commerce/contracts`
  - `GET /commerce/fulfillment`
  - `GET /commerce/invoices`
  - `GET /commerce/payments`
- Целевые endpoint для полной интеграции:
  - `POST/PATCH` операции бизнес-цикла с UI-формами и валидацией

## 8. Критерий готовности MVP
- [x] В sidebar добавлен корневой раздел `Коммерция`
- [x] Позиция раздела: строго между `Управление Урожаем` и `Стратегия`
- [x] Подключены 4 подмаршрута Commerce
- [x] Созданы 4 каноничных страницы-заглушки
- [x] На `/commerce/contracts` подключен реальный API `GET /commerce/contracts`
- [x] На `/commerce/fulfillment` подключен реальный API `GET /commerce/fulfillment`
- [x] На `/commerce/invoices` подключен реальный API `GET /commerce/invoices`
- [x] На `/commerce/payments` подключен реальный API `GET /commerce/payments`
- [x] Реализован smart routing (`entity`/`severity` + `data-focus`) на всех экранах Commerce
- [x] Добавлены автотесты навигационного контракта и сценария фокусировки
- [x] SPA-навигация между маршрутами работает без перезагрузки
- [x] В добавленном коде не используется `font-bold` и `font-semibold`

## 9. Production-ready checklist
- [x] заменить демо-данные на реальные API-метрики
- [ ] унифицировать/почистить кодировку текстов (без кракозябр)
- [x] добавить e2e-сценарий "клик -> переход -> подсветка сущности"

## 10. Технический долг
- Что не доделано:
  - Нет UI-форм полного цикла (создание договора, событие исполнения, формирование документа, регистрация оплаты).
- Почему не сделано сейчас:
  - Текущий этап закрывает read-only навигационный и обзорный контур.
- Приоритет:
  - Form workflow: `High`
  - QA для POST/PATCH-цикла: `Medium`
- Следующий конкретный шаг:
  - Реализовать UI-форму создания договора (`POST /commerce/contracts`) с валидацией ролей сторон.

## 11. Ссылки на TD-ID в `99_TECH_DEBT_CHECKLIST.md`
- `TD-COMMERCE-API-001`
- `TD-COMMERCE-UX-001`
- `TD-COMMERCE-QA-001`
