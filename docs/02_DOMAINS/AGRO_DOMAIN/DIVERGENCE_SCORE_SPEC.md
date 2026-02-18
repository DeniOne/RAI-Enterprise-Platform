---
id: DOC-DOM-AGRO-LC-003
type: Domain Specification
layer: Agro Domain (Business Layer)
status: Draft
version: 1.6.0
owners: [@techlead]
last_updated: 2026-02-18
---

# DIVERGENCE IMPACT SCORE
## Бизнес-метрика аномальности переопределений (Level C)

---

## 3. DIS Versioning & Weight Policy

### 3.1. Append-Only Governance (I31 Hardening)
Для исключения возможности "подмены" исторической правды:
1. **Immutability Mandate:** Таблица `GovernanceConfig` работает по принципу **Append-Only**. Любой UPDATE на уровне БД запрещен.
2. **Atomic Versioning:** Новая версия весов = новая строка с уникальным `version_id`.
3. **Draft Linking:** При сохранении переопределения поле `disVersion` в `DivergenceRecord` является внешним ключом (FK) на конкретную строку в `GovernanceConfig`.

---

## 4. Детерминизм и Округление

### 4.1. Numeric Precision Policy (8-Digit Wrapper)
Выбор точности **8 знаков** обоснован необходимостью бесконфликтного поглощения данных из разных доменов:
- **Finance:** Требует 2 знака. 8 знаков покрывают это с запасом $10^6$.
- **Agronomy/Yield:** Требует 4 знака. 8 знаков покрывают это с запасом $10^4$.
- **Risk Probabilities:** Требуют 6 знаков для улавливания "хвостов" распределения.
- **Result:** 8 знаков — это минимально достаточный "наименьший общий знаменатель", гарантирующий отсутствие кумулятивной ошибки округления при детерминированном хешировании.

---

[Changelog]
- v1.5.0: DIS Versioning & Weight Policy.
- v1.6.0: Append-Only Mandate. Запрет UPDATE для GovernanceConfig. Обоснование 8-значной точности (Numeric Policy). (D5++)
