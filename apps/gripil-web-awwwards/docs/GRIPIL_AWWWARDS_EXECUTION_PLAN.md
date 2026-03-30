---
id: GRIPIL-EXEC-002
layer: Execution
type: WBS
status: active
version: 1.1.0
owners: [AI_CODER, DESIGNER]
last_updated: 2026-03-29
claim_id: CLAIM-GRIPIL-EXEC-002
claim_status: asserted
verified_by: manual
last_verified: 2026-03-29
evidence_refs:
  - apps/gripil-web-awwwards/src/app/layout.tsx
  - apps/gripil-web-awwwards/src/app/api/lead/route.ts
  - apps/gripil-web-awwwards/src/lib/site-profile.ts
  - apps/gripil-web-awwwards/src/components/FooterCTA.tsx
  - apps/gripil-web-awwwards/src/components/SocialProofSection.tsx
  - apps/gripil-web-awwwards/src/components/SplitComparisonViewer.tsx
  - apps/gripil-web-awwwards/playwright.config.ts
---

# GRIPIL WEB AWWWARDS EXECUTION PLAN

## CLAIM
id: CLAIM-GRIPIL-EXEC-002
status: asserted
verified_by: manual
last_verified: 2026-03-29

## Назначение
Документ фиксирует актуальный execution-пакет для `apps/gripil-web-awwwards` после release hardening 2026-03-29.

Его задача теперь не в том, чтобы разгонять эффектность любой ценой, а в том, чтобы удерживать Awwwards-level подачу без возврата к нечестному UX, служебным маршрутам и production-небезопасным сценариям.

## Текущий статус
- Кодовые `P0` из аудита закрыты.
- Runtime-контракт формы стал честным: без боевого webhook заявка не уходит в success state.
- Blocking preloader удалён.
- `/test` удалён из production surface.
- Public legal/contact baseline добавлен.
- Motion и SSR path упрощены для более устойчивого mobile/runtime поведения.

## Жёсткие инварианты
- Нельзя возвращать blocking preloader или любой экран, который держит `body overflow: hidden` и скрывает hero.
- Нельзя возвращать fake-success submit flow, `local-log` или любой success-path без подтверждённой доставки лида.
- Нельзя возвращать публичные debug/demo/test route'ы в build.
- Нельзя публиковать неподтверждённые proof claims и анонимные отзывы как production trust-layer.
- Нельзя включать consent по умолчанию.
- Нельзя публиковать canonical production metadata, пока не заполнен реальный `site-profile` через `GRIPIL_*`.

## Release Gate
Релиз считается допустимым только после одновременного выполнения всех условий:

1. Заполнен `GRIPIL_LEAD_WEBHOOK_URL`.
2. Заполнены `GRIPIL_SITE_URL`, `GRIPIL_COMPANY_SHORT_NAME`, `GRIPIL_COMPANY_LEGAL_NAME`, `GRIPIL_CONTACT_PHONE`, `GRIPIL_CONTACT_EMAIL`, `GRIPIL_COMPANY_ADDRESS`.
3. `npm run lint`, `npm run build` и `npx playwright test` зелёные.
4. Production-like `next start` подтверждает:
   - `200` для `/`, `/privacy`, `/company`, `/contact`, `/robots.txt`, `/sitemap.xml`
   - `404` для `/test`
   - `503` для valid `POST /api/lead` без webhook и `200` только после реальной интеграции
5. Canonical и indexable metadata появляются только после полного production profile.

## Ближайшие действия

### 1. Закрыть env-gate релиза
- Подставить реальный `GRIPIL_LEAD_WEBHOOK_URL`. Эффект: форма начнёт доставлять лиды в production, а не честно отклонять отправку.
- Заполнить весь `GRIPIL_*` профиль. Эффект: появятся production canonical/metadata, legal-страницы перестанут показывать временные значения, сайт станет пригоден для индексации и платного трафика.

### 2. Добить release QA на production-домене
- Повторить `next start` и smoke-проверки уже с боевыми env. Эффект: команда подтвердит не только кодовую готовность, но и реальную deploy-конфигурацию.
- Проверить форму на боевом webhook и зафиксировать факт доставки. Эффект: исчезает последний остаточный blocker по конверсии.

### 3. Вынести polish за релизный контур
- Дошлифовать secondary contrast и floating navigation. Эффект: визуальная чистота вырастет без риска вернуть blocking UX.
- Подготовить верифицируемые кейсы для trust layer. Эффект: social proof станет сильнее без репутационного риска.
- Провалидировать доменные диапазоны и тексты агрономических обещаний. Эффект: контент станет устойчивее к профессиональной проверке рынка.

## Что уже нельзя планировать как улучшение
- Возврат high-end preloader.
- Возврат анонимных social proof claims.
- Возврат `ssr: false` для ключевого storytelling-контента.
- Возврат англоязычных user-facing labels в русской витрине.

## Финальный ориентир
Целевое состояние этого лендинга теперь формулируется так:

- визуально сильный Awwwards-level surface;
- честная и проверяемая конверсия;
- production-safe routing;
- базовый legal/SEO/a11y слой;
- release через env-gate, а не через ручные договорённости.
