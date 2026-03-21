---
id: DOC-STR-STAGE-2-RAI-AI-ANTIHALLUCINATION-ARCHITECT-1BGY
layer: Strategy
type: Vision
status: draft
version: 0.1.0
owners: [@techlead]
last_updated: 2026-03-21
claim_id: CLAIM-STR-STAGE2-ANTIHALLUCINATION
claim_status: asserted
verified_by: manual
last_verified: 2026-03-21
evidence_refs: docs/00_STRATEGY/STAGE 2/RAI_AI_SYSTEM_ARCHITECTURE.md;docs/11_INSTRUCTIONS/AGENTS;apps/api/src/modules/rai-chat
---
# RAI AI Anti-Hallucination Architecture

## CLAIM
id: CLAIM-STR-STAGE2-ANTIHALLUCINATION
status: asserted
verified_by: manual
last_verified: 2026-03-21

Этот документ является действующим архитектурным каноном по снижению галлюцинаций и evidence-дисциплине в AI-контуре. Он задаёт обязательные проектные ограничения, а не доказывает, что все антигаллюцинаторные механизмы уже полностью внедрены.

Версия: 1.0  
Статус: Architectural Standard  
Назначение: Минимизация галлюцинаций AI-агентов в системе RAI_EP

---

# 1. Проблема галлюцинаций

LLM-модели склонны генерировать правдоподобные, но неверные утверждения.

Для агрономической системы это критично, поскольку ошибка может привести к:

- неправильной дозировке СЗР
- экономическим потерям
- экологическому ущербу
- потере доверия агрономов

Поэтому архитектура RAI использует **многоуровневую антигаллюцинационную систему**.

---

# 2. Основной принцип

AI не является источником истины.

AI:

- предлагает
- анализирует
- объясняет

Но:

- расчёты выполняет deterministic engine
- факты берутся из базы данных
- решения подтверждает человек

Формула:

AI proposes → System verifies → Human approves

---

# 3. Архитектура антигаллюцинационной системы

Pipeline ответа:

User Request  
↓  
SupervisorAgent  
↓  
Retriever (context + knowledge)  
↓  
Domain Agent (Agronom / Economist)  
↓  
Verification Layer  
↓  
Deterministic Validation  
↓  
RiskGate  
↓  
Human Review (если требуется)

---

# 4. Retrieval-Augmented Generation (RAG)

AI не генерирует ответы из своей обучающей выборки.

Каждый ответ должен основываться на реальных источниках:

- Knowledge Graph
- Field Data
- Soil Profile
- Weather Data
- Satellite Data
- TechMap Data

Flow:

User question  
↓  
Semantic retrieval  
↓  
Context assembly  
↓  
LLM reasoning

---

# 5. Evidence Protocol

Каждая рекомендация AI должна содержать:


recommendation
evidence
sources
confidence


Если источников нет:

AI обязан ответить:

"Недостаточно данных для рекомендации."

---

# 6. Verification Agent

Дополнительный агент проверяет ответы основного агента.

Проверки:

1. логическая консистентность
2. наличие источников
3. соответствие агрономическим правилам
4. корректность чисел

---

# 7. Cross-Model Validation

Для критичных рекомендаций используется проверка другой моделью.

Example:

AgronomAgent (GPT-4o)  
↓  
VerifierAgent (Claude)  
↓  
Supervisor

Если модели расходятся:

- результат помечается как "uncertain"
- требуется human review

---

# 8. Deterministic Validation Layer

Все численные рекомендации проходят проверку.

Examples:

- норма высева
- дозировка СЗР
- совместимость баковых смесей
- фаза BBCH
- погодные ограничения

Validation pipeline:

AI recommendation  
↓  
DomainValidationEngine  
↓  
PASS / REJECT

---

# 9. Confidence Scoring

Каждый ответ получает confidence score.

Факторы:

- полнота источников
- similarity retrieval
- consistency checks
- модельная уверенность

Thresholds:


confidence > 0.7 → OK
confidence 0.4–0.7 → caution
confidence < 0.4 → escalate


---

# 10. Hallucination Risk Score

Система рассчитывает вероятность галлюцинации.

Факторы:

- отсутствие источников
- конфликт данных
- out-of-distribution вопрос
- модельная неуверенность

---

# 11. Semantic Verified Cache

Проверенные ответы сохраняются.

Pipeline:

User question  
↓  
semantic similarity search  
↓  
verified answer found  
↓  
return cached answer

---

# 12. Structured Output Protocol

AI не генерирует свободный текст.

Ответы имеют строгую JSON структуру.

Example:


{
recommendation: "",
evidence: [],
confidence: 0.82,
sources: []
}


---

# 13. Human-in-the-Loop

AI не может выполнять критические действия.

Examples:

- активация техкарты
- изменение бюджета
- применение СЗР

Workflow:

AI Draft  
↓  
Human Review  
↓  
System Commit

---

# 14. Observability

Каждое AI-решение логируется.

Audit log содержит:

- traceId
- agent
- tool calls
- sources
- confidence
- validation result

---

# 15. Целевой результат

Цель архитектуры:


Hallucination rate < 3%


---

# 16. Ключевой принцип

AI не является источником истины.

Истина:

- данные
- правила
- детерминированные расчёты
