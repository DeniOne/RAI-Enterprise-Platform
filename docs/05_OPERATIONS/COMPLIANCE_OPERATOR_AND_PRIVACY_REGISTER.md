---
id: DOC-OPS-COMPLIANCE-OPERATOR-PRIVACY-REGISTER-20260328
layer: Operations
type: Report
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-28
claim_id: CLAIM-OPS-COMPLIANCE-OPERATOR-PRIVACY-REGISTER-20260328
claim_status: asserted
verified_by: manual
last_verified: 2026-03-28
evidence_refs: packages/prisma-client/schema.prisma;apps/api/src/shared/auth/front-office-auth.service.ts;apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.ts;apps/web/app/api/auth/front-office/_utils.ts;docs/_audit/RF_COMPLIANCE_REVIEW_2026-03-28.md
---
# COMPLIANCE OPERATOR AND PRIVACY REGISTER

## CLAIM
id: CLAIM-OPS-COMPLIANCE-OPERATOR-PRIVACY-REGISTER-20260328
status: asserted
verified_by: manual
last_verified: 2026-03-28

## Назначение
Этот документ фиксирует текущий applied privacy/compliance baseline по `RAI_EP`.

Он является канонической операционной точкой входа для:
- inventory по категориям данных и субъектам;
- формулирования operator/processor вопросов;
- подготовки пакета по 152-ФЗ, 149-ФЗ и связанным требованиям;
- аудитов, где нужно отделять подтверждённый кодом факт от неподтверждённого юридического статуса.

## Нормативные якоря
- 152-ФЗ и актуальные изменения:
  - <https://publication.pravo.gov.ru/document/0001202408080031>
  - <https://publication.pravo.gov.ru/document/0001202502280034>
- Роскомнадзор:
  - <https://pd.rkn.gov.ru/>
  - <https://rkn.gov.ru/>
- ФСТЭК: <https://fstec.ru/>
- ФСБ / криптосредства: <https://clsz.fsb.ru/>

## Статус по ролям

| Вопрос | Текущий статус | Что подтверждено локально | Что не подтверждено |
|---|---|---|---|
| Кто является оператором ПДн | `не подтверждено` | код и документы показывают обработку ПДн и tenant data | юридическое лицо, реквизиты оператора, распределение ролей по договорам |
| Есть ли отдельные обработчики / процессоры | `вероятно да` | код использует внешние provider-like integrations | договорные роли, DPA/processor terms, страны обработки |
| Есть ли basis pack по целям и основаниям | `частично` | по коду видны продуктовые сценарии auth, invite, lookup, AI traces, telegram | нет единого legal packet с lawful basis и policy wording |

## Inventory субъектов и данных

| Контур | Субъекты данных | Что подтверждено кодом | Класс данных | Статус |
|---|---|---|---|---|
| Аутентификация и доступ | сотрудники, внутренние пользователи, front-office пользователи | `User.email`, `User.phone`, `User.telegramId`, `User.passwordHash`, `Invitation.email`, `Invitation.telegramId` в `packages/prisma-client/schema.prisma` | идентификаторы, учётные данные, контакты | `code-backed` |
| Контрагенты и party/contact контур | контрагенты, контакты контрагентов, приглашённые пользователи | `apps/api/src/shared/auth/front-office-auth.service.ts` создаёт и активирует приглашения, хранит snapshot контакта | ФИО, телефон, email, Telegram ID, party/account linkage | `code-backed` |
| Telegram / уведомления | telegram users, операторы, получатели уведомлений | `TELEGRAM_BOT_TOKEN` и telegram runtime в `apps/telegram-bot/src/app.module.ts` и `apps/api/src/modules/telegram/telegram-notification.service.ts` | Telegram ID, служебные уведомления, auth links | `code-backed` |
| AI / explainability / incident trail | пользователи AI-контуров, участники расследований | `SensitiveDataFilterService` маскирует email/телефон/ИНН и пишет `PII_LEAK` incident | trace metadata, snippets, incident details | `code-backed` |
| Коммерческий lookup | контрагенты РФ, банки, организации | `apps/api/src/modules/commerce/services/providers/dadata.provider.ts` делает lookup по ИНН и БИК | идентификаторы организаций и банковские реквизиты | `code-backed` |
| Финансы / документы / договоры | компании, стороны договоров, экономические события | `packages/prisma-client/schema.prisma` содержит legal/finance сущности и retention поля | договорные, финансовые и операционные данные | `code-backed`, но policy incomplete |

## Обязательные privacy-артефакты

| Артефакт | Статус | Комментарий |
|---|---|---|
| Data inventory | `создан в кодо-ориентированном виде` | этот регистр + `docs/_audit/PRIVACY_DATA_FLOW_MAP_2026-03-28.md` |
| Operator / processor role memo | `не подтверждено` | нужен внешний legal owner и реквизиты |
| Notification status в РКН | `не подтверждено` | в репозитории нет evidence по факту уведомления |
| Localization decision log | `не подтверждено` | нужен хостинг/residency evidence вне кода |
| Transborder decision register | `создан как технический каркас` | см. deployment/transborder matrix, но внешние страны и основания не подтверждены |
| Subject rights runbook | `создан` | см. `PRIVACY_SUBJECT_RIGHTS_AND_RETENTION_RUNBOOK.md` |
| Retention / deletion schedule | `частично` | retention поля и WORM контур есть, но полный legal schedule отсутствует |
| Privacy notice / consent wording | `не подтверждено` | текста публичных/внутренних notices вне repo не обнаружены |

## Блокеры для внешнего запуска
1. Нет подтверждённого юридического лица-оператора и распределения operator/processor ролей.
2. Нет подтверждения notification status в РКН.
3. Нет подтверждённой локализации и transborder decision pack для фактически используемых providers.
4. Нет полного privacy notice / lawful basis / retention schedule пакета.

## Прямой следующий operational шаг
Собрать внешний legal packet поверх этого регистра: реквизиты оператора, notification status, hosting geography, processor contracts и lawful-basis matrix.

Эффект:
- legal/compliance аудит перестанет опираться на догадки;
- пилот и enterprise rollout можно будет оценивать по подтверждённым артефактам, а не по косвенным признакам в коде.
