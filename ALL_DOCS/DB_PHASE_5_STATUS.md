# DB_PHASE_5_STATUS

## Scope

`Phase 5. Enum Taxonomy Cleanup`.

## Done

- [x] Создан и синхронизирован `ENUM_DECISION_REGISTER.md`.
- [x] Покрытие register: `149` enum (`schema.prisma`).
- [x] Добавлен gate: `scripts/check-enum-decision-register.cjs` + `gate:db:enum-register:enforce`.
- [x] Подготовлена overlap matrix:
- [x] `DB_ENUM_OVERLAP_MATRIX.md` (`risk/status/source/type/mode`).
- [x] Зафиксированы rename/convert кандидаты и owner approvals.
- [x] Исправлен literal defect `BudgetCategory.FERTILIZERS`:
- [x] canonical enum value = `FERTILIZER`;
- [x] подготовлена migration wave `20260313214500_phase5_budget_category_literal_fix`.
- [x] Mixed-transition backlog снижен `17 -> 3` через обновление scope-manifest классификации.

## Residual

- [ ] Physical enum migrations (`merge/rename/convert_to_reference_table`) еще не выполнены.
- [ ] Массовые convert-to-reference-table волны остаются отдельным tranche.
