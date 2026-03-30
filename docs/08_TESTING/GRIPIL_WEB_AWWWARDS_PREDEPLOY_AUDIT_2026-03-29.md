---
id: DOC-TST-GRIPIL-WEB-AWWWARDS-PREDEPLOY-AUDIT-20260329
layer: Testing
type: Audit
status: active
version: 0.2.0
owners: [@techlead, @qa_lead, @frontend_lead]
last_updated: 2026-03-29
claim_id: CLAIM-TST-GRIPIL-WEB-AWWWARDS-PREDEPLOY-AUDIT-20260329
claim_status: asserted
verified_by: manual
last_verified: 2026-03-29
evidence_refs: apps/gripil-web-awwwards/src/app/layout.tsx;apps/gripil-web-awwwards/src/app/api/lead/route.ts;apps/gripil-web-awwwards/src/lib/site-profile.ts;apps/gripil-web-awwwards/src/app/robots.ts;apps/gripil-web-awwwards/src/app/sitemap.ts;apps/gripil-web-awwwards/src/app/privacy/page.tsx;apps/gripil-web-awwwards/src/app/company/page.tsx;apps/gripil-web-awwwards/src/app/contact/page.tsx;apps/gripil-web-awwwards/src/components/FooterCTA.tsx;apps/gripil-web-awwwards/src/components/FAQAccordion.tsx;apps/gripil-web-awwwards/src/components/ScrollNavigation.tsx;apps/gripil-web-awwwards/src/components/SmoothScroll.tsx;apps/gripil-web-awwwards/src/components/SplitComparison.jsx;apps/gripil-web-awwwards/src/components/SplitComparisonViewer.tsx;apps/gripil-web-awwwards/src/components/YieldCalculator.tsx;apps/gripil-web-awwwards/tests/release-hardening.spec.ts;apps/gripil-web-awwwards/tests/yield-calculator.spec.ts;apps/gripil-web-awwwards/playwright.config.ts
---
# ПРЕДДЕПЛОЙНЫЙ АУДИТ GRIPIL WEB AWWWARDS 2026-03-29

## CLAIM
id: CLAIM-TST-GRIPIL-WEB-AWWWARDS-PREDEPLOY-AUDIT-20260329
status: asserted
verified_by: manual
last_verified: 2026-03-29

## Назначение
Документ фиксирует post-remediation снимок лендинга `apps/gripil-web-awwwards` после исправления кодовых блокеров из исходного аудита.

Этот документ разделяет:
- закрытые кодовые дефекты;
- подтверждённые runtime-результаты;
- остаточные release gate, которые теперь лежат не в коде, а в deployment-конфигурации.

## Контур проверки
- Дата повторной верификации: `2026-03-29`
- Контур:
  - `npm run lint`
  - `npm run build`
  - `npx playwright test`
  - `next start` на динамическом локальном порту
  - прямые HTTP-проверки `/`, `/privacy`, `/company`, `/contact`, `/robots.txt`, `/sitemap.xml`, `/test`, `POST /api/lead`

## Executive Summary
Кодовые `P0` из исходного аудита закрыты. Лендинг больше не показывает фальшивый success без интеграции, не блокирует первый экран preloader-экраном, не публикует `/test`, проходит базовый accessibility/legal baseline и получил production-safe routing/metadata surface.

При этом релизный gate полностью не снят. Два остатка вынесены в deployment-конфигурацию:
- не задан `GRIPIL_LEAD_WEBHOOK_URL`, поэтому valid `POST /api/lead` сейчас честно возвращает `503`;
- не заполнен production `site-profile` через `GRIPIL_*`, поэтому локальный production-like контур держит `noindex` и не публикует canonical.

Итоговый статус: `READY AFTER MINOR FIXES`.

## Что было подтверждено и закрыто

### P0
- `POST /api/lead` больше не отдаёт `ok:true/local-log` без webhook.
- Форма больше не показывает ложный success path.
- Blocking preloader удалён из runtime.
- Публичный `/test` удалён из build и подтверждён как `404`.
- FAQ переведён на `button` и проходит keyboard baseline.
- Телефонное поле имеет явный label/aria wiring.
- Floating nav controls подписаны через `aria-label`.
- Consent стал explicit opt-in.
- Добавлены `privacy/company/contact` страницы.
- User-facing локализация добита: удалены `Scan Result`, `ROI` и другие англоязычные хвосты в витрине.

### P1
- Добавлены `robots.txt` и `sitemap.xml`.
- OG metadata публикуется.
- Split storytelling больше не уходит в `ssr: false`.
- Reduced motion расширен на hero/problem/lenis/section reveal path.
- Неподтверждённый proof-layer ослаблен до нейтрального trust-блока без анонимных claims.
- Снят лишний hydration masking в layout и calculator.

## Что подтверждено повторной проверкой
- `npm run lint` проходит.
- `npm run build` проходит.
- Build output содержит:
  - `/`
  - `/company`
  - `/contact`
  - `/privacy`
  - `/robots.txt`
  - `/sitemap.xml`
  - не содержит `/test`
- `npx playwright test` проходит: `5/5`.
- Production-like `next start` подтверждает:
  - `/` -> `200`
  - `/privacy` -> `200`
  - `/company` -> `200`
  - `/contact` -> `200`
  - `/robots.txt` -> `200`
  - `/sitemap.xml` -> `200`
  - `/test` -> `404`
  - valid `POST /api/lead` без webhook -> `503` и честная ошибка
  - invalid `POST /api/lead` -> `400`
- В HTML главной страницы подтверждены:
  - `og:title`
  - ссылки на `/privacy`, `/company`, `/contact`
- В `robots.txt` при неполном профиле подтверждён `Disallow: /`.
- В `sitemap.xml` подтверждены `/privacy`, `/company`, `/contact`.

## Остаточные блокеры

### Blocker
- Не задан `GRIPIL_LEAD_WEBHOOK_URL`.
  - Эффект: лиды не доставляются, а endpoint честно отвечает `503`.
  - Что сделать: подключить боевой webhook и перепроверить valid submit уже на реальной интеграции.

### Major
- Не заполнен production `site-profile` через `GRIPIL_*`.
  - Эффект: локальный production-like контур остаётся в `noindex`, canonical не публикуется, legal-страницы показывают временные значения.
  - Что сделать: заполнить `GRIPIL_SITE_URL`, `GRIPIL_COMPANY_SHORT_NAME`, `GRIPIL_COMPANY_LEGAL_NAME`, `GRIPIL_CONTACT_PHONE`, `GRIPIL_CONTACT_EMAIL`, `GRIPIL_COMPANY_ADDRESS`.

### Polish
- Secondary contrast и floating navigation ещё можно дошлифовать.
- Trust-layer можно усилить верифицируемыми кейсами после получения доказательной базы.
- Доменные диапазоны и отдельные агрономические формулировки требуют профильной контентной валидации.

## Acceptance Checklist
- [ ] Нет релизных блокеров
- [x] Нет fake-success lead flow
- [ ] Все лиды доставляются честно
- [x] Нет blocking preloader
- [x] Нет служебных публичных route
- [x] Нет production-visible debug/demo страниц
- [x] Все key CTA работают
- [x] Форма имеет loading / success / error states
- [x] Нет double submit problem
- [x] Consent реализован корректно
- [x] Есть privacy/company/contact baseline
- [x] FAQ доступен с клавиатуры
- [x] Icon-only controls подписаны
- [x] Phone input доступен и понятен
- [x] Нет критичных localization issues
- [x] Нет смешения языков в user-facing UI
- [ ] Есть canonical / OG / robots / sitemap
- [x] Нет критичных hydration/rendering рисков
- [x] Motion не ломает mobile UX в текущем baseline
- [x] Reduced motion покрыт на критичных сценах
- [x] Нет console/runtime errors на production-like run, кроме ожидаемого fail-closed лога webhook gate
- [ ] Сайт выглядит finished and pre-deploy ready

## Release Decision
Кодовая база перешла из состояния `NOT READY` в состояние `READY AFTER MINOR FIXES`.

Перед выкладкой обязательно выполнить два действия:
1. Подключить реальный `GRIPIL_LEAD_WEBHOOK_URL`. Эффект: форма начнёт доставлять лиды, а не честно отклонять submit.
2. Заполнить production `GRIPIL_*` профиль. Эффект: включатся canonical/indexable metadata и исчезнут временные legal/contact значения.

## Финальный verdict
Итоговый статус: `READY AFTER MINOR FIXES`.

Release-owner conclusion:
кодовые релизные стоп-факторы сняты, но платный трафик и публичный production deploy по-прежнему нельзя включать до заполнения webhook и полного `site-profile`.
