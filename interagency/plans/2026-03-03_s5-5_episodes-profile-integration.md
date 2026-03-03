# PLAN — S5.5 Episodes/Profile Integration
Дата: 2026-03-03
Статус: active
Decision-ID: AG-MEMORY-CANON-001

## Результат
- `MemoryAdapter.getProfile` и `MemoryAdapter.updateProfile` перестают быть заглушками и начинают работать с `MemoryProfile`.
- Появляется минимальный write/read path для `MemoryEpisode` и `MemoryProfile`, достаточный для закрытия пункта DoD: `Episodes/Profile сохраняются и используются при ответах`.
- `SupervisorAgent` начинает учитывать `Profile` и/или `Episode` в prompt composition без нарушения tenant isolation.

## Основание
- `docs/00_STRATEGY/STAGE 2/RAI_AGENT_OS_IMPLEMENTATION_PLAN.md`
  - `Definition of Done`: `Episodes/Profile сохраняются и используются при ответах (в процессе)`
- `docs/01_ARCHITECTURE/PRINCIPLES/MEMORY_CANON.md`
- уже реализованные шаги:
  - S5.1 `MemoryAdapter`
  - S5.3 Prisma schema
  - S5.4 `MemoryInteraction` write routing

## Границы
- Входит:
  - интеграция `MemoryProfile` в `DefaultMemoryAdapter`
  - минимальная интеграция `MemoryEpisode` или episode-like consolidation path
  - использование profile/episode данных в ответе `SupervisorAgent`
  - unit tests и truth-sync
- Не входит:
  - полноценный background summarizer/worker
  - сложный episode ranking pipeline beyond MVP
  - массовые миграции или очистка legacy memory flows

## Текущее состояние
- `MemoryEpisode` и `MemoryProfile` уже существуют в Prisma.
- `getProfile` / `updateProfile` в `DefaultMemoryAdapter` сейчас stub.
- `retrieve` работает через `EpisodicRetrievalService`, но явной записи episodes/profile и их использования в `SupervisorAgent` нет.

## MVP-решение
- `MemoryProfile`
  - хранить 1 active profile record per `(companyId, userId)` или scoped fallback
  - `getProfile` читает актуальный профиль из `MemoryProfile`
  - `updateProfile` делает upsert/patch в `MemoryProfile` с каноничным `attrs`
- `MemoryEpisode`
  - на MVP этапе писать компактный episode-record из interaction/advisory outcome или memory-worthy facts
  - retrieval может оставаться на текущем сервисе, если он уже способен читать episode-tier; иначе ограничить MVP profile-first integration и явно зафиксировать gap
- `SupervisorAgent`
  - добавляет profile/episode context в ответный reasoning path без изменения внешнего API-контракта

## Риски
- Легко переусложнить задачу и полезть в полноценную summarization-платформу вместо минимального closeout.
- Есть риск неявного дублирования между `MemoryInteraction` и `MemoryEpisode`.
- Нужно аккуратно определить ключ identity для `MemoryProfile`, особенно для случаев без `userId`.

## План работ
- [ ] Сформировать prompt на реализацию `Episodes/Profile` integration.
- [ ] Проверить фактический Prisma-контракт `MemoryEpisode` и `MemoryProfile`.
- [ ] Реализовать `getProfile` и `updateProfile` в `DefaultMemoryAdapter`.
- [ ] Определить и реализовать минимальный путь записи `MemoryEpisode` без фонового воркера.
- [ ] Подключить `SupervisorAgent` к profile/episode context при формировании ответа.
- [ ] Добавить unit tests на `DefaultMemoryAdapter` и `SupervisorAgent`.
- [ ] После реализации обновить report/index/checklists/memory-bank.

## Критерии приемки
- [ ] `getProfile` / `updateProfile` больше не заглушки.
- [ ] `MemoryProfile` реально используется в runtime-path ответа.
- [ ] `MemoryEpisode` либо реально пишется и читается, либо MVP-gap явно зафиксирован в отчёте с обоснованием.
- [ ] Пункт DoD `Episodes/Profile сохраняются и используются при ответах` может быть переведён в выполненное состояние или честно декомпозирован на остаточный хвост.

## Артефакты на ревью
- `interagency/prompts/2026-03-03_s5-5_episodes-profile-integration.md`
- `interagency/plans/2026-03-03_s5-5_episodes-profile-integration.md`
