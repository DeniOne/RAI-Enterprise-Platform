---
id: DOC-ARC-ADR-LD-002
layer: Architecture
type: ADR
status: Accepted
version: 2.0.0
owners: [@techlead]
last_updated: 2026-02-18
---

# ADR-LD-002: Immutable Model Lineage (Иммутабельная линейность)

## Контекст

При обнаружении bias или деградации появляется необходимость "откатить" модель. Простая перезапись (overwrite) нарушает D1. Требуется механизм, сохраняющий историю, но гарантирующий безопасность.

## Решение

Зафиксировать: **Rollback создаёт новую версию (Fork), а плохая версия помечается как BLACKLISTED.**

---

### 1. Версионная семантика Rollback (D5+)

Rollback — это создание новой версии, семантически эквивалентной старой, но с новым ID для сохранения DAG-целостности.

```typescript
interface ModelVersion {
  id: string;
  parentId: string;        // Ссылка на "плохую" версию (v3), от которой мы отказались
  
  // Rollback Metdata
  rollbackOf?: string;     // Ссылка на "хорошую" версию (v2), чью конфигурацию копируем
  rollbackReason?: string; // "BIAS_DETECTED", "PERFORMANCE_DEGRADATION"
  
  // Config (Copy of v2)
  featureSchemaVersion: string;
  preprocessingVersion: string;
}
```

### 2. Запрет повторного использования (Blacklist Policy)

Если версия $V_{bad}$ признана дефектной и выполнен откат:

1.  $Status(V_{bad}) \leftarrow \text{'BLACKLISTED'}$.
2.  **Invariant:** Blacklisted версия НЕ может быть:
    *   Активирована (Promoted to ACTIVE).
    *   Использована как родитель для *нового* обучения (кроме Rollback-fork).
    *   Выбрана для Canary-тестов.

### 3. Rollback Policy Guard

Rollback — это восстановление *предыдущего* состояния, а не частичная реконфигурация.

**Запрещено при Rollback:**
*   Менять `featureSchemaVersion`.
*   Менять `preprocessingVersion`.
*   Менять `governanceThresholds`.

$$Config(V_{rollback}) \equiv Config(V_{original})$$

### 4. DAG Integrity Constraint (D6)

Граф версий обязан оставаться **Acyclic Directed Graph (DAG)**.

*   **No Cycles:** $V_1 \to V_2 \to V_1$ — запрещено.
*   **Time Arrow:** $Parent(V).createdAt < V.createdAt$.
*   **Forking:** Допускается ветвление (эксперименты), но `ACTIVE` путь всегда линеен или переключается через явный Rollback.

---

## Обоснование

1.  **Safety:** Мы гарантируем, что "плохой" код/конфиг больше никогда не попадет в прод.
2.  **Forensics:** Мы видим всю историю: попытку обновления (v3), отказ, и возврат (v4).
3.  **D1/D2:** Полное соблюдение иммутабельности и воспроизводимости.
4.  **DAG Guard:** Математическая гарантия отсутствия временных петель в lineage.

## Последствия

**Плюсы:**
*   Математически строгая история изменений.
*   Невозможно "случайно" включить плохую версию.
*   Полная прозрачность для аудитора.

**Минусы:**
*   Экспоненциальный рост графа при частых откатах (решается архивацией).
*   Сложность визуализации для пользователей (нужен UI, схлопывающий rollback-ветки).
