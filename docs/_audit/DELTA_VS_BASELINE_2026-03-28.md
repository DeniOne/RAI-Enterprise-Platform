---
id: DOC-ARV-AUDIT-DELTA-VS-BASELINE-20260328
layer: Archive
type: Research
status: approved
version: 1.2.0
owners: [@techlead]
last_updated: 2026-03-28
---
# DELTA VS BASELINE 2026-03-28

## 1. Ограничение Сравнения

`docs/_audit/FINAL_AUDIT_2026-03-20.md` был прежде всего documentation/governance baseline. Текущий due diligence охватывает код, gates, build/test, security, privacy и legal/compliance. Поэтому часть красных сигналов ниже — это не обязательно деградация относительно 2026-03-20, а newly surfaced runtime evidence.

## 2. Улучшилось

| Baseline факт | Текущий факт | Evidence | Интерпретация |
|---|---|---|---|
| 2026-03-20 аудит фиксировал docs governance transition и слабую trustworthiness документации | В репозитории уже есть `DOCS_MATRIX`, unified docs lint, layered docs model, active instructions layer | `README.md`, `docs/README.md`, `docs/CONTRIBUTING_DOCS.md`, `package.json` | governance foundation стала зрелее |
| На docs baseline не было единого code-backed AI governance picture | Сейчас подтверждены `PII_LEAK`, incident ops, autonomy/policy incidents, explainability paths, truthfulness metrics | `interagency/INDEX.md`, `apps/api/src/modules/rai-chat/*` | AI-runtime стал существенно более наблюдаемым |
| Ранее WORM/audit contour был на уровне intent | Сейчас в memory-bank зафиксирован fail-closed WORM bootstrap и retention verification intent | `memory-bank/activeContext.md` | audit-notarization direction стала сильнее |
| В текущем аудите устранены два известных docs blockers | fixed `Runbook` type и YAML frontmatter у `_audit` prompt | repo changes dated `2026-03-28` | docs governance шум уменьшен |
| 2026-03-20 baseline не доказывал единый quality baseline по основному контуру | Сейчас `apps/api`, `apps/web`, `apps/telegram-bot` и routing проходят актуальные build/test/gates | command evidence 2026-03-28 | репозиторий вышел из режима fragmented red baseline |
| Guard coverage и raw SQL governance раньше были явной красной зоной | `controllers_without_guards=0`, `raw_sql_review_required=0`, `raw_sql_unsafe=0`, `violations=0` | `pnpm gate:invariants`, `node scripts/raw-sql-governance.cjs --enforce` | security hygiene заметно улучшилась и текущий invariant baseline стал зелёным |
| Repo hygiene не показывала явного исправления key incident | `infra/gateway/certs/ca.key` удалён из рабочего дерева и больше не tracked в текущем индексе | `test ! -f infra/gateway/certs/ca.key`, `git rm --cached --force infra/gateway/certs/ca.key` | текущий SCM-риск снижен, остаётся history review и rotation debt |

## 3. Деградировало Или Вскрылось Как Новый Красный Факт

| Baseline факт | Текущий факт | Evidence | Интерпретация |
|---|---|---|---|
| 2026-03-20 baseline не оценивал runtime build/test health системно | Текущий аудит выявил, а затем отдельным remediation-пакетом закрыл красный runtime baseline в тот же день | command evidence 2026-03-28, `memory-bank/progress.md` | сами регрессии были реальны, но к версии `1.1.0` отчёта quality baseline уже восстановлен |
| Безопасность ранее оценивалась фрагментарно | Исторический key-incident вокруг `ca.key` подтверждён, хотя текущий repo state уже очищен от active invariant violations | repo evidence, `pnpm gate:invariants` | риск уже не theoretical, но в текущем baseline он перешёл из active repo issue в history/rotation debt |
| Схема БД ранее не сравнивалась с manifest discipline так детально | `gate:db:scope` показывает missing manifest entries для новых `TechMap*` моделей | DB gate evidence | growth discipline есть, но manifest hygiene не догнала изменения |

## 4. Осталось Красным

| Проблема | Baseline 2026-03-20 | Статус 2026-03-28 | Evidence |
|---|---|---|---|
| Документацию нельзя использовать как единственный source of truth | красный | красный, но теперь лучше разделена по слоям | `FINAL_AUDIT_2026-03-20.md`, root docs, current runtime evidence |
| Governance шум и drift между intent и code | красный | частично красный: docs слой стал чище, но `gate:db:scope` и supply-chain/security evidence gaps сохраняются | docs baseline + current DB/security evidence |
| Отсутствие полного compliance/legal pack | не раскрыто полноценно | красный | current RF review |
| Отсутствие enterprise-grade supply-chain controls | не раскрыто полноценно | красный | no `SAST/SCA/SBOM/provenance/secret scanning` evidence |
| Полностью воспроизводимый security audit path | не раскрыто полноценно | красный | `timeout 30s pnpm audit --audit-level=high` exhausted |

## 5. Delta Summary

- Улучшилось: docs governance foundation, AI observability/governance contours, WORM/audit direction, green build/test/routing baseline, fully green invariant baseline, guard coverage и raw SQL governance.
- Деградировало или вскрылось: historical key-incident по `ca.key` и DB scope manifest drift были обнаружены и локализованы evidence-first аудитом.
- Осталось красным: compliance pack, supply-chain discipline, `gate:db:scope` и невоспроизводимый в timebox security audit path.
