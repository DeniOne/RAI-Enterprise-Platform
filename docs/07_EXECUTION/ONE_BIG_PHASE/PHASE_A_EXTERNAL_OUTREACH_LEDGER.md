---
id: DOC-EXE-ONE-BIG-PHASE-A-EXTERNAL-OUTREACH-LEDGER-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.3.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OUTREACH-LEDGER-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a-external-outreach-ledger.cjs;scripts/phase-a-external-outreach-transition.cjs;scripts/phase-a-external-reply-intake-bridge.cjs;scripts/phase-a-external-reply-capture-packet.cjs;package.json;var/execution/phase-a-external-outreach-ledger.json;var/execution/phase-a-external-outreach-ledger.md;var/execution/phase-a-external-reply-intake-bridge.json;var/execution/phase-a-external-reply-capture-packet.json;var/execution/phase-a-external-owner-outreach.json;var/execution/phase-a-external-owner-queues.json;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_OWNER_OUTREACH_PACKET.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md;docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md
---
# PHASE A EXTERNAL OUTREACH LEDGER

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A-EXTERNAL-OUTREACH-LEDGER-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот ledger переводит `Phase A external owner outreach` из состояния “сообщения уже готовы” в наблюдаемую внешнюю очередь. Он не заменяет request packet и не подменяет evidence intake, а фиксирует, что уже отправлено, кто подтвердил получение и где реально ждём ответ.

## 1. Команды

Собрать ledger:

- `pnpm phase:a:external-outreach-ledger`

Проверить gate:

- `pnpm gate:phase:a:external-outreach-ledger`

Связанные команды:

- `pnpm phase:a:external-owner-outreach`
- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=sent --contact=mail@example.com --at=2026-03-31`
- `pnpm phase:a:external-reply-capture`
- `pnpm phase:a:external-reply-bridge`
- `pnpm phase:a:closeout`

## 2. Что выпускается

Generated evidence:

- `var/execution/phase-a-external-outreach-ledger.json`
- `var/execution/phase-a-external-outreach-ledger.md`

Restricted tracker perimeter:

- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OUTREACH-LEDGER/INDEX.md`
- `/root/RAI_EP_RESTRICTED_EVIDENCE/execution/2026-03-31/request-packets/PHASE-A-EXTERNAL-OUTREACH-LEDGER/<queue>/TRACKER.md`

Следующий bridge-слой:

- [PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md)
- [PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md)

## 3. Что считается сильным результатом

Сильный результат этого слоя:

- видно не только какие пакеты готовы, но и какие уже реально ушли наружу;
- внешний хвост `Phase A` можно вести как operational queue, а не как статичный набор `MESSAGE.md`;
- становится ясно, где фаза застряла: не отправили, отправили, ждём подтверждение, получили ответ или закрыли очередь.

## 4. Допустимые outreach-статусы

- `prepared` — пакет собран, но ещё не отправлен
- `sent` — сообщение отправлено, подтверждения ещё нет
- `acknowledged` — владелец подтвердил получение
- `replied` — пришёл ответ или файл, но intake/review ещё не завершён
- `closed` — эта очередь больше не держит внешний blocker

## 5. Что не делает этот ledger

- не меняет `requested / received / reviewed / accepted` автоматически;
- не заменяет legal/security/pilot intake команды;
- не означает, что `Phase A` сдвинулась, пока не появился реальный внешний ответ.

## 6. Как переводить статусы безопасно

Новый статус выставлять не ручной правкой tracker-файла, а через CLI:

- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=sent --contact=mail@example.com --at=2026-03-31`
- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=acknowledged --contact=mail@example.com --at=2026-04-01`
- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=replied --contact=mail@example.com --at=2026-04-02 --note=получен пакет документов`
- `pnpm phase:a:external-outreach:transition -- --queue=@chief_legal_officer --status=closed --at=2026-04-03 --note=очередь больше не держит blocker`

Допустимая последовательность:

- `prepared -> sent`
- `sent -> acknowledged | replied | closed`
- `acknowledged -> replied | closed`
- `replied -> closed`

## 7. Что должно измениться дальше

Следующее реальное изменение после этого слоя:

- owner queues должны начать переходить из `prepared` в `sent`;
- затем часть очередей должна перейти в `acknowledged` и `replied`;
- после `replied` сначала использовать [PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_CAPTURE_PACKET.md), чтобы raw owner reply лег в каноническую drop-zone;
- после `replied` использовать [PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md](/root/RAI_EP/docs/07_EXECUTION/ONE_BIG_PHASE/PHASE_A_EXTERNAL_REPLY_INTAKE_BRIDGE.md), чтобы запустить уже правильный `intake -> reviewed -> accepted`;
- после этого `Phase A closeout` будет меняться не по подготовке, а по фактическому внешнему движению.
