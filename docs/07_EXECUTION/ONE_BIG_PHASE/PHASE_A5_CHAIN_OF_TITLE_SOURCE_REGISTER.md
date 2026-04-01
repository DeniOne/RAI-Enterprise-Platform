---
id: DOC-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-SOURCE-REGISTER-20260331
layer: Execution
type: Phase Plan
status: approved
version: 1.0.0
owners: ["@techlead"]
last_updated: 2026-03-31
claim_id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-SOURCE-REGISTER-20260331
claim_status: asserted
verified_by: manual
last_verified: 2026-03-31
evidence_refs: scripts/phase-a5-chain-of-title-register.cjs;package.json;apps/api/package.json;apps/web/package.json;packages/prisma-client/schema.prisma;var/compliance/phase-a5-chain-of-title-source-register.json;var/compliance/phase-a5-chain-of-title-source-register.md
---
# PHASE A5 CHAIN OF TITLE SOURCE REGISTER

## CLAIM
id: CLAIM-EXE-ONE-BIG-PHASE-A5-CHAIN-OF-TITLE-SOURCE-REGISTER-20260331
status: asserted
verified_by: manual
last_verified: 2026-03-31

Этот документ нужен, чтобы `ELP-20260328-09` собирался не “вообще по проекту”, а по конкретной repo-derived карте first-party активов.

## 1. Что даёт этот register

Этот register:

- перечисляет first-party workspace perimeter;
- отдельно выделяет database/schema perimeter;
- показывает, какие asset classes должен покрыть внешний chain-of-title pack;
- снимает риск, что legal собирает только часть правового периметра.

Он не даёт:

- signed legal verdict;
- accepted external evidence;
- автоматического закрытия `A5.3`.

## 2. Как его выпускать

Команда:

- `pnpm phase:a5:chain-of-title`

Жёсткая проверка:

- `pnpm gate:phase:a5:chain-of-title`

Generated output:

- `var/compliance/phase-a5-chain-of-title-source-register.json`
- `var/compliance/phase-a5-chain-of-title-source-register.md`

## 3. Как его использовать для `ELP-20260328-09`

Правильный порядок:

1. Выпустить свежий register через `pnpm phase:a5:chain-of-title`.
2. Открыть `var/compliance/phase-a5-chain-of-title-source-register.md`.
3. Для каждого asset class проверить, какие внешние документы уже есть:
   - employment clauses
   - contractor/IP assignment
   - DB rights
   - board/legal sign-off
4. Только после этого дозаполнять внешний `ELP-20260328-09`.

## 4. Что должно быть покрыто внешним пакетом

Минимум должны быть покрыты:

- root first-party repository perimeter;
- application workspaces;
- shared packages и engine packages;
- canonical Prisma schema и database rights perimeter;
- generated client / schema composition basis там, где он нужен для доказательства происхождения артефактов.

## 5. Практический эффект

После появления этого register:

- `ELP-20260328-09` собирается по явной карте активов;
- `A5` меньше зависит от ручной памяти о составе репозитория;
- legal/commercial closeout по правам на ПО и БД становится конкретнее, а не абстрактнее.
