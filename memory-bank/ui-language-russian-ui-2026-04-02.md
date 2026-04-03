# UI Language Russian UI 2026-04-02

## Что изменено

- В `apps/web/lib/ui-language.ts` введён централизованный слой пользовательских formatter-ов для статусов, типов подтверждений, advisory-уровней и AI-виджетов.
- Ключевые веб-контуры (`dashboard`, `crm`, `forensics`, `front-office`, `strategic`, `gripil-web`) переведены на русский пользовательский режим в первом большом проходе.
- Англоязычные proxy/error-сообщения в `apps/web/app/api/advisory/recommendations/*` локализованы, чтобы сырой английский не пробрасывался в UI.
- Для placeholder-разделов `economy/finance/gr/knowledge/production/settings/strategy` англоязычные заглушки заменены на русские.

## Новый инвариант

- Любой backend/status/enum код, попадающий в пользовательский UI, должен проецироваться через formatter или label map.
- Прямой рендер значений вроде `ACTIVE`, `DRAFT`, `in_progress`, `HIGH`, `PHOTO`, `LAB_REPORT` считается дефектом UI-языка.

## Защита от регресса

- Добавлен скрипт `scripts/ui-language-audit.cjs`.
- Добавлена корневая команда `pnpm lint:ui-language`.
- Добавлен тест `apps/web/__tests__/ui-language.spec.ts` на критичные formatter-ы.

## Остаток после первого прохода

- Автоматический аудит после первого большого прохода показывает `212` подозрительных вхождений.
- Основные хвосты остались в `control-tower`, `governance/security`, `consulting`, `crm/accounts`, `party-assets`, `ai-chat`.

## Второй проход

- Второй системный проход снизил остаток автоматического аудита до `94` подозрительных вхождений.
- Во втором проходе дополнительно русифицированы `crm/accounts`, `governance/security`, `consulting/results`, `consulting/yield`, `telegram-login`, `front-office`-карточки, `ai-chat`, `knowledge`, `party-assets` и часть advisory/execution-ошибок.
- `scripts/ui-language-audit.cjs` уточнён whitelist-моделью для допустимых технических сущностей и шаблонных `${...}`-вставок, чтобы отчёт показывал в основном реальные UI-хвосты, а не технический шум.
- После второго прохода основные живые хвосты сосредоточены в `control-tower`, `consulting/execution`, `commerce`, `exploration`, `strategic/legal` и части `party-assets`.

## Финальный проход

- Финальный проход добрал остатки в `control-tower`, `consulting/execution`, `commerce`, `debug`, `strategic/legal`, `party-assets`, `gripil-web` и связанных proxy/auth route.
- Operational-formatter-ы для `control-tower` и trace-разбора (`governance keys`, `trust latency profile`, `ingress source`) вынесены в общий `apps/web/lib/ui-language.ts`, чтобы русская UI-проекция не зависела от локальных helper-функций страниц.
- Formatter-ы `security/compliance` (`incident type`, `compliance status`) тоже вынесены в общий `apps/web/lib/ui-language.ts`, а страница `governance/security` переведена на общий слой отображения.
- `scripts/ui-language-audit.cjs` дополнительно усилен для отсечения чисто технических срабатываний на model labels, `SHA-256`, `WebApp`, шаблонные тернарные выражения и допустимые продуктовые/технические аббревиатуры.
- Итоговый автоматический аудит: `0` подозрительных вхождений.
- `pnpm lint:ui-language` проходит успешно.
- `pnpm --filter web test -- --runInBand ui-language.spec.ts` проходит успешно, включая покрытие formatter-ов `control-tower` и `security/compliance`.
- `pnpm --filter web exec tsc -p tsconfig.json --noEmit` проходит успешно.
- В пакет артефактов добавлен отдельный файл сравнения `var/ui-language-audit/UI_LANGUAGE_BEFORE_AFTER.md`, где зафиксированы реальные пары пользовательских строк в формате «было → стало» по ключевым экранам и mapping-слоям.
- После пользовательской приёмки проведён отдельный screenshot-driven проход по живым экранам техкарт, планов, front-office, execution и party-assets.
- По итогам screenshot-driven прохода добавлены formatter-ы для культур, форм культуры, канонических веток, обязательных блоков техкарты, stage-кодов, explainability/parity сообщений, единиц ресурсов, типов почв и видимых source-kind ярлыков.
- Новый практический инвариант: если внутреннее техническое значение попало в видимый UI и не может быть показано по-русски естественно, его нужно не оставлять как есть, а заменить понятным пояснением или скрыть из пользовательского блока.
- Последние живые хвосты были закрыты в `apps/web/app/(app)/control-tower/page.tsx` и `apps/web/app/(app)/control-tower/agents/page.tsx`: сырые payload JSON, raw tool/phase labels и служебная строка `MarketerAgent: summary, evidence, next_steps` больше не попадают в пользовательский экран.
- Для этого слой `apps/web/lib/ui-language.ts` дополнен formatter-ом инструментов/фаз (`formatToolLabel`), а `control-tower` переведён на скрытие технического payload и русскую локаль дат.
- Финальный живой Playwright-аудит `var/ui-language-audit/e2e-visible-language.spec.ts` прошёл с результатом `47` экранов и `0` страниц с видимыми англоязычными токенами.
- После пользовательского screenshot-report был выполнен дополнительный точечный проход по `front-office`: в `apps/web/app/(app)/front-office/page.tsx`, `threads/[threadKey]/page.tsx` и `context/page.tsx` убраны сырые intent-коды (`consultation`, `observation`), clarification-коды (`LINK_OBJECT`, `LINK_FIELD_OR_TASK`, `LINK_SEASON`), owner/channel labels (`contracts_agent`, `ADMIN`, `TELEGRAM`) и mixed handoff-подсказки.
- Для этого слой `apps/web/lib/ui-language.ts` дополнен formatter-ами `front-office`-контура: intent, clarification, channel, direction, owner и text normalizer для user-facing сообщений и handoff summary.
- Точечная живая проверка `http://127.0.0.1:3000/front-office` после правки не находит хвостов `consultation`, `observation`, `LINK_*`, `contracts_agent`, `handoff`, `South Field Farm`, `TELEGRAM`, `ADMIN`, `chatId`, `Telegram` в видимом тексте страницы.
- После UX-уточнения изменена иерархия меню блока `Хозяйства и Контрагенты`: порядок навигации теперь отражает воронку зависимостей `Контрагенты -> Хозяйства -> Поля -> Объекты`, а не начиняется с хозяйств.
- Порядок синхронизирован между боевым `apps/web/lib/consulting/navigation-policy.ts`, CRM-хабом `apps/web/app/consulting/crm/page.tsx` и тестовым `apps/web/test-nav-standalone.js`, чтобы flyout и экран не расходились.

## Практическое правило для следующих изменений

- Новый пользовательский текст сначала должен получить русскую форму.
- Технические исключения допустимы только для имён файлов, путей, форматов, протоколов, общепринятых аббревиатур и внешних продуктовых имён.
- Перед завершением любого крупного UI-изменения нужно запускать `pnpm lint:ui-language` и проверять, не утёк ли английский в пользовательский контур.
- Для экранов с высоким риском утечки внутренних данных проверка должна дополняться живым e2e-проходом по видимым маршрутам, а не ограничиваться статическим поиском строк.
