# RAI_EP — AI governance and autonomy policy

**Назначение:** определить, как AI/агенты работают внутри системы без разрушения управляемости, достоверности и enterprise-безопасности.

---

## 1. Базовый принцип

AI в `RAI_EP` — это governed advisory and orchestration layer.

Он не является суверенным центром принятия high-impact решений и не может обходить policy, evidence requirements, tool restrictions и human confirmation.

---

## 2. Что AI разрешено

- классифицировать и маршрутизировать запросы;
- собирать и кратко структурировать контекст;
- формировать draft-ответы и рекомендации;
- объяснять логику рекомендации;
- помогать в анализе отклонений, рисков и вариантов действий;
- запускать допустимые low-risk tool flows в пределах allowlist.

---

## 3. Что AI запрещено без отдельного human gate

- запускать необратимые write actions;
- менять критичные состояния техкарты;
- отправлять юридически, финансово или репутационно значимые внешние сообщения;
- подтверждать факты без достаточного evidence;
- использовать tools вне route-specific permission matrix;
- выполнять high-impact действия без logging и explainability.

---

## 4. Обязательные policy blocks

### Tool-permission matrix
Для каждого route class должен существовать допустимый набор инструментов.

### HITL matrix
Для каждого класса high-impact действия должен быть определён обязательный human confirmation rule.

### Evidence policy
Система не должна выдавать уверенный ответ при недостаточной доказательной базе.

### Uncertainty policy
При неполной информации система обязана явно обозначать ограниченность вывода.

### Incident policy
Любой evidence bypass, unsafe autonomy, tool misuse, PII leak, wrong-evidence answer или policy drift должен оставлять incident record.

---

## 5. Release criteria для AI

AI runtime нельзя считать release-ready, пока не выполнены все условия:

- есть formal safety eval suite;
- есть regression coverage по основным agent/routing slices;
- есть tool matrix;
- есть HITL matrix;
- есть incident review cadence;
- есть scorecards по truthfulness/evidence/unsafe actions.

---

## 6. Уровни автономии

### Level A — read/advisory only
AI читает, анализирует, предлагает, но ничего критичного не меняет.

### Level B — bounded operational assistance
AI может инициировать ограниченные low-risk действия в рамках жёсткого allowlist и логирования.

### Level C — high-impact execution
Для `RAI_EP` такой уровень допустим только как исключение при отдельной политике и доказанной зрелости, а не как режим по умолчанию.

---

## 7. Метрики управления AI

- evidence coverage rate;
- uncertainty correctness rate;
- unsupported answer rate;
- blocked unsafe action rate;
- policy violation rate;
- incident closure time;
- cost per successful governed task.

---

## 8. Главный запрет

Нельзя развивать агентность быстрее, чем формализуются policy, release gates, legal boundaries и enterprise-контроль. Иначе продукт будет расти как демонстрация AI, а не как управляемая система.
