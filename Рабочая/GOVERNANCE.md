DOCUMENTATION GOVERNANCE MODEL (RAI_EP)
0. Статус
Version: 1.0 (Draft)
Role: Foundation Policy / Doc-Topology
Owner: Tech Lead (AI CTO)
1. Doc Typology (Классификация)
Каждый документ в системе docs/ обязан соответствовать одному из типов:

Type	Layer	Purpose
Vision	Strategy	Определение глобальных целей и "Зачем"
Roadmap	Strategy	Стратегические фазы развития
ADR	Architecture	Обоснование конкретного архитектурного решения
HLD	Architecture	Высокоуровневая структура (C4, схемы)
Domain Spec	Domain	Описание бизнес-сущностей, FSM и процессов
API Contract	Engineering	Технические контракты (OpenAPI, Events)
Standards	Engineering	Правила написания кода, каноны систем
Runbook	Operations	Инструкции для живой системы (инциденты)
Report	Operations	Факты работы системы (ADVISORY_*, Audit)
Phase Plan	Execution	План конкретного этапа работ (WBS, Спринты)
2. Dependency Matrix (Правила ссылок)
Соблюдается принцип Downward Visibility Only:

Strategy — Не зависит ни от чего внизу. Ссылается только на Strategy.
Architecture — Зависит от Strategy. Не ссылается на Engineering/Operations.
Domain — Зависит от Architecture и Strategy.
Engineering — Зависит от Domain и Architecture.
Operations — Зависит от Engineering (Runbooks).
Execution — Ортогональный слой. Может ссылаться на любые спецификации.
3. Policy: File Creation (Правила создания)
Любой новый 
.md
 файл без заголовков ниже считается НАРУШЕНИЕМ и подлежит немедленной реструктуризации или удалению.

Mandatory Header Structure:

yaml
---
type: [Typology Type]
layer: [Layer Name]
status: [Draft | Review | Approved | Legacy]
depends_on: [Path to Parent/Policy]
---
4. Location Governance
Запрещено создание файлов в корне /docs.
Единственные разрешенные файлы в корне: README.md (intro) и INDEX.md (map).
Все функциональные домены должны иметь суффикс _DOMAIN (например, RAI_DOMAIN, CONSULTING_DOMAIN).
5. Enforcement (Control)
Любая AI-среда (IDE) обязана проверять данные правила перед сохранением файлов. Раз в спринт проводится Doc Audit с чисткой папки 08_ARCHIVE.


Comment
CTRL+ALT+M
