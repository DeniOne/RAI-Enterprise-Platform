# PROMPT — R4 Claim Accounting and Coverage (Truth Sync Recovery)
Дата: 2026-03-05  
Статус: active  
Приоритет: P0

## Цель
Сделать quality-модель `BS% / Evidence Coverage / invalidClaimsPct` прозрачной и воспроизводимой. После `R1-R3` у нас уже есть plumbing: `evidence` доезжает до audit trail, `TraceSummary` хранит честные nullable quality-поля, `TruthfulnessEngine` вызывается из runtime в правильном порядке. Но сама модель оценки пока слишком грубая: система умеет считать `bsScorePct` по `EvidenceReference`, но не фиксирует полноценный accounting claims (`total / evidenced / invalid / unverified`), а `invalidClaimsPct` по-честному вообще не живёт. `R4` должен превратить quality из полуэвристики в прозрачный контракт.

## Контекст
- Почему это важно сейчас:
  - Без канонического claim accounting `BS%` остаётся грубым приближением, а не нормальной quality-метрикой.
  - `Evidence Coverage` пока нельзя честно объяснить как долю от чего именно она считается.
  - `invalidClaimsPct` сейчас сознательно не пишется, потому что нет прозрачной модели. Это правильно, но это и есть следующий разрыв.
- Что уже сделано:
  - `R1`: evidence сохранён в `AiAuditEntry.metadata`
  - `R2`: `TraceSummary` стал nullable и перестал врать нулями
  - `R3`: truthfulness pipeline вызывается из боевого runtime-контура без race
- На какие документы опираемся:
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_STAGE_2_CLAIMS.md`
  - `docs/00_STRATEGY/STAGE 2/TRUTH_SYNC_RECOVERY_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/A_RAI_IMPLEMENTATION_CHECKLIST.md`
  - `docs/00_STRATEGY/STAGE 2/RAI_AI_ANTIHALLUCINATION_ARCHITECTURE.md`
- Ключевые текущие файлы:
  - `apps/api/src/modules/rai-chat/truthfulness-engine.service.ts`
  - `apps/api/src/modules/rai-chat/dto/rai-chat.dto.ts`
  - `apps/api/src/modules/rai-chat/trace-summary.service.ts`
  - `apps/api/src/modules/explainability/explainability-panel.service.ts`
  - `apps/api/src/modules/explainability/dto/trace-summary.dto.ts`
  - `apps/api/src/modules/explainability/dto/trace-forensics.dto.ts`

## Ограничения (жёстко)
- `companyId` только из trusted context.
- Не трогать `Agent Registry`, autonomy, incidents, control tower UI, prompt governance.
- Не делать “идеальную научную онтологию claims” на 5 экранов. Нужна минимальная, но честная модель.
- Не подменять отсутствие данных эвристикой, если её нельзя объяснить в 1-2 предложениях и покрыть тестами.
- Backward compatibility обязательна:
  - старые traces без полноценного claim accounting не должны ломать чтение;
  - nullable quality-поля остаются допустимыми, если для старых данных расчёт невозможен.

## Задачи (что сделать)
- [ ] Явно определить и зафиксировать минимальную каноническую модель claim accounting:
  - `totalClaims`
  - `claimsWithEvidence`
  - `verifiedClaims`
  - `unverifiedClaims`
  - `invalidClaims`
- [ ] Решить, где эта модель живёт на первом этапе:
  - либо внутри `TruthfulnessEngine` как промежуточный расчёт,
  - либо как отдельный internal result object, который затем используется для обновления `TraceSummary`.
- [ ] Сделать `Evidence Coverage` прозрачной метрикой:
  - не “процент чего-то”, а конкретно `claimsWithEvidence / totalClaims * 100`
- [ ] Сделать `invalidClaimsPct` честной метрикой:
  - `invalidClaims / totalClaims * 100`
  - если totalClaims = 0, поведение должно быть явно определено и покрыто тестом
- [ ] Обновить `TruthfulnessEngine`, чтобы он возвращал не только `bsScorePct`, но и достаточный набор quality-derived данных для `TraceSummary.updateQuality(...)`.
- [ ] Обновить `TraceSummary` quality update contract под новый набор метрик.
- [ ] Обновить explainability/forensics DTO и readers так, чтобы они честно отдавали новые поля без лжи.
- [ ] Добавить или обновить тесты на канонические сценарии:
  - 100% verified
  - mixed verified/unverified/invalid
  - no evidence
  - empty trace / zero claims

## Что не делать
- [ ] Не делать новый dashboard UI.
- [ ] Не вводить сложный ML-scoring или probabilistic bullshit index.
- [ ] Не считать acceptance/correction rate в рамках этой задачи.
- [ ] Не расползаться в cross-model validation.
- [ ] Не менять внешние продуктовые сценарии чата, если это не нужно для quality contract.

## Definition of Done (DoD)
- [ ] У системы есть прозрачная и тестируемая claim-accounting модель.
- [ ] `Evidence Coverage` считается от явного знаменателя, а не как ad-hoc эвристика.
- [ ] `invalidClaimsPct` начинает считаться честно и писатьcя в `TraceSummary`, если данные достаточны.
- [ ] `TruthfulnessEngine` возвращает quality result, достаточный для осмысленного `updateQuality`.
- [ ] Explainability / forensics / summary contracts читают новую модель без падений и без подмены данных.
- [ ] `tsc` PASS.
- [ ] Целевые `jest` PASS.

## Тест-план (минимум)
- [ ] Unit/spec: `100% verified claims -> bsScore=0, coverage=100, invalid=0`
- [ ] Unit/spec: `mixed claims -> корректные bsScore / coverage / invalid`
- [ ] Unit/spec: `claims without evidence -> coverage < 100 и честный BS%`
- [ ] Unit/spec: `empty trace / zero claims -> явно определённый fallback`
- [ ] Unit/spec: `TraceSummary.updateQuality` получает новый честный набор quality-метрик
- [ ] Unit/spec: explainability DTO/services не ломаются на новых полях
- [ ] `pnpm exec tsc -p tsconfig.json --noEmit` для затронутого пакета
- [ ] Целевые `jest` по затронутым файлам/модулям

## Что вернуть на ревью
- Изменённые файлы (список).
- Короткое описание канонической модели claim accounting.
- Формулы расчёта:
  - `bsScorePct`
  - `evidenceCoveragePct`
  - `invalidClaimsPct`
- Результаты `tsc`.
- Результаты `jest`.
- Короткое доказательство из тестов, что quality-метрики считаются от прозрачных знаменателей, а не эвристически.

## Критерий приёмки техлидом
Задача считается принятой только если после доработки можно честно объяснить любому человеку в команде, как именно считаются `BS%`, `Evidence Coverage` и `invalidClaimsPct`, и это объяснение совпадает с кодом, тестами и данными в `TraceSummary`.
