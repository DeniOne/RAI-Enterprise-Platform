---
id: DOC-ARV-AUDIT-CONTRADICTIONS-20260320
layer: Archive
type: Research
status: approved
version: 1.0.0
owners: [@techlead]
last_updated: 2026-03-20
---
# CONTRADICTIONS

| Документ A | Документ B | Конфликт | Риск |
|---|---|---|---|
| docs/README.md | docs/Аудит готовности проекта 2026-03-19.md | README формулирует near-production narrative; аудит фиксирует pilot/pre-production | неправильные продуктовые решения |
| docs/INDEX.md | scripts/doc-lint-matrix.cjs | INDEX допускает root/absolute ссылки; lint требует строгую топологию и frontmatter | постоянный красный governance gate |
| docs/00_STRATEGY/STAGE 2/* | docs/11_INSTRUCTIONS/AGENTS/* | часть cross-links использует неверный relative path и URL-encoding | маршрутные ошибки onboarding |
| docs/01_ARCHITECTURE/TOPOLOGY/LAYER_TYPE_MATRIX.md | старые frontmatter type/layer в legacy docs | матрица строже фактической разметки | ложные нарушения и шум |
