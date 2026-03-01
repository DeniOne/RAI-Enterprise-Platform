# PLAN — Подключить apps/telegram-bot к Agro Draft→Commit
Дата: 2026-03-01  
Статус: ready_for_review  
Decision-ID: AG-TELEGRAM-DRAFT-COMMIT-001  

## Результат (какой артефакт получим)
- Исполнимый план подключения `apps/telegram-bot` к каноническому доменному API Draft→Commit в `apps/api` (P0.3), без раздвоения телеграм-контуров.
- Зафиксированный scope для бота: intake (text/voice/photo) → create draft → ответ с кнопками ✅✏️🔗 (везде `draftId`) → вызовы `fix/link/confirm`.

## Границы (что входит / что НЕ входит)
- Входит: изменения в `apps/telegram-bot` для формирования draft-потока и вызовов API; формат callback data; минимальный прогон сценария с логами.
- Не входит: любые изменения доменной логики Draft→Commit (она должна жить в `apps/api`); UI-полировка текстов; параллельные телеграм-контуры.
- Не входит: `commit/push` и отметки чеклистов/memory-bank до внешнего ревью.
- Не входит: любые попытки определять tenant через `companyId` из callback/body; бот использует только доверенный auth/session-контекст API.

## Риски (что может пойти не так)
- Контракт API по Draft→Commit может меняться в ходе P0.3 → риск переделки бота, если стартовать код до стабилизации.
- Security-риск: случайно протащить `companyId` из callback/body или “починить” доступ через хардкод.
- Callback data может превысить лимиты Telegram или быть недостаточно устойчивой к коллизиям → нужен короткий формат.
- Admission-риск: если `Decision-ID` не подтверждён со статусом `ACCEPTED`, реализация должна быть остановлена до явного допуска.

## План работ (коротко, исполнимо)
- [ ] Подтвердить, что `Decision-ID` `AG-TELEGRAM-DRAFT-COMMIT-001` имеет статус `ACCEPTED` и его scope покрывает закрепление `apps/telegram-bot` как единственного Telegram-транспорта; при отсутствии подтверждения остановить реализацию.
- [ ] Подтвердить зависимость: P0.3 API готов и допущен (Decision `AG-AGRO-DRAFT-COMMIT-001` = `ACCEPTED`), а операции `create draft`, `fix`, `link`, `confirm` доступны/стабильны для интеграции; если контракт P0.3 не стабилен, остановить реализацию до его фиксации.
- [ ] Определить формат callback data (коротко и однозначно, влезает в лимит Telegram `callback_data`): `agro:<action>:<draftId>`, где `action ∈ {confirm, fix, link}`. Никаких `companyId`/tenant-данных в callback data.
- [ ] Реализовать intake:
  - [ ] text → create draft
  - [ ] photo → create draft с `evidence=photo` / metadata по контракту API
  - [ ] voice → create draft с `evidence=audio` (минимально, без ASR, если вне scope)
- [ ] Реализовать обработчики кнопок:
  - [ ] ✅ confirm → API confirm; если `missingMust[]` не пуст — показать MUST-вопросы; иначе показать “committed”.
  - [ ] 🔗 link → собрать refs (поле/задача/ферма) и вызвать API link.
  - [ ] ✏️ fix → собрать patch (минимально) и вызвать API fix.
- [ ] Добавить минимальный прогон: “фото+текст → draft → link → confirm → committed” с логами (или e2e).

## Тест-план (минимальный, но проверяемый)
- [ ] Smoke: text → draft создаётся, бот возвращает кнопки ✅✏️🔗 с корректным `draftId`.
- [ ] Smoke: photo → draft создаётся, `draftId` пробрасывается в callback data.
- [ ] Flow: draft → link → confirm:
  - [ ] если API возвращает `missingMust[]` непустой — бот показывает MUST-вопросы/статус и НЕ делает вид “committed”.
  - [ ] если `missingMust[]` пуст — бот показывает успешный результат “committed”.
- [ ] Security: в коде бота нет принятия/прокидывания `companyId` из текста/кнопок/metadata как источника истины; tenant определяется только доверенным auth/session-контекстом API.

## DoD
- [ ] `apps/telegram-bot` создаёт draft для text/voice/photo и возвращает кнопки ✅✏️🔗 с `draftId`.
- [ ] Все callback’и несут `draftId`; по нажатию идут вызовы `fix/link/confirm`.
- [ ] Tenant isolation соблюдён: `companyId` не принимается из пользовательского ввода; используется доверенная авторизация/сессия.
- [ ] `apps/telegram-bot` остаётся единственным Telegram-транспортом; новый параллельный контур не появляется.
- [ ] Есть воспроизводимый прогон сценария с логами.
