---
id: DOC-ARH-CORE-SYS-001
type: Architecture
layer: Core Subsystems
status: Draft
version: 1.5.0
owners: [@techlead]
last_updated: 2026-02-18
---

# CONFLICT ENGINE
## Подсистема разрешения и анализа конфликтов (Level C)

---

## 3. Resilience & Policy Fetching

### 3.1. RiskEscalationPolicy Resilience (I33)
Для обеспечения детерминизма и отказоустойчивости при работе с внешним сервисом политик:

1. **Deterministic Fetch Timing:** Политика запрашивается СТРОГО один раз в момент вызова `record()`. Полученный `version_id` политики становится частью `CanonicalInput` для расчета хеша.
2. **Local Caching:** Сервис обязан иметь теплый L1-кэш активных политик (Redis/In-Memory).
3. **Circuit Breaker & Fallback:**
   - Если сервис политик недоступен ($timeout > 200ms$), CE использует локально кэшированную версию.
   - Если кэш пуст — применяется **Hardcoded Defensive Fallback** (порог 0.1, т.е. максимально жесткий режим).
4. **Failure Logging:** Любое использование Fallback-политики помечается флагом `IS_SYSTEM_FALLBACK` в аудит-логе.

---

[Changelog]
- v1.4.0: Precision Hardening.
- v1.5.0: Service Resilience. Специфицирован Deterministic Fetch, Circuit Breaker и стратегия Hardcoded Fallback для RiskEscalationPolicy. (D5++)
