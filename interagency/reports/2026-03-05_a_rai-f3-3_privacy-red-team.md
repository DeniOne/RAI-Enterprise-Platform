# Отчёт — A_RAI F3.3: SensitiveDataFilter & Red-Team Suite

**Дата:** 2026-03-05  
**Промт:** `interagency/prompts/2026-03-05_a_rai-f3-3_privacy-red-team.md`  
**Decision-ID:** AG-ARAI-F3-003

---

## 1. Изменённые файлы

| Файл | Изменение |
|------|-----------|
| `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.ts` | **Создан** — маскировка PII (ИНН, р/с 40x, email, телефон) |
| `apps/api/src/modules/rai-chat/security/sensitive-data-filter.service.spec.ts` | **Создан** — unit-тесты фильтра |
| `apps/api/src/modules/rai-chat/composer/response-composer.service.ts` | Пропуск `text` через `SensitiveDataFilterService.mask()` перед возвратом |
| `apps/api/src/modules/rai-chat/composer/response-composer.service.spec.ts` | Мок `SensitiveDataFilterService` в провайдерах |
| `apps/api/src/modules/rai-chat/eval/red-team/red-team-payloads.json` | **Создан** — 3 payload (Prompt Injection, Tenant Escape, Role Bypass) |
| `apps/api/src/modules/rai-chat/eval/red-team/red-team.spec.ts` | **Создан** — прогон payload через IntentRouter, проверка отсутствия опасного autoCall |
| `apps/api/src/modules/rai-chat/rai-chat.module.ts` | Провайдер `SensitiveDataFilterService` |
| `apps/api/src/modules/rai-chat/rai-chat.service.spec.ts` | Мок `SensitiveDataFilterService` |
| `apps/api/src/modules/rai-chat/supervisor-agent.service.spec.ts` | Мок `SensitiveDataFilterService`; фикс ожидания текста "Отклонений найдено: 1" |

---

## 2. tsc --noEmit

```
PASS (exit 0)
```

---

## 3. Jest — целевые тесты

- `sensitive-data-filter.service.spec.ts` — **PASS** (8 тестов)
- `red-team.spec.ts` — **PASS** (2 теста: не падает на payload-ах, вредоносные не дают опасного autoCall)
- `response-composer.service.spec.ts` — **PASS**
- Все тесты `src/modules/rai-chat` — **115 passed**

---

## 4. Пример замаскированного ответа

Вход: `"Счет 40702810900000001234, email test@mail.ru"`  
Выход: `"Счет ***, email [HIDDEN_EMAIL]"`  
(р/с 20 цифр 40x → `***`, email → `[HIDDEN_EMAIL]`; ИНН 10/12 цифр → `[ИНН СКРЫТ]`, телефон → `[ТЕЛЕФОН СКРЫТ]`)  
(ИНН 10/12 цифр → `[ИНН СКРЫТ]`, телефоны +7/8 → `[ТЕЛЕФОН СКРЫТ]`)

---

## 5. DoD

- [x] `SensitiveDataFilterService` реализован, покрыт тестами на ИНН, р/с, email, телефон
- [x] `ResponseComposer` пропускает финальный текст через маскировку PII
- [x] `red-team-payloads.json` и `red-team.spec.ts` в `eval/red-team/`
- [x] `tsc --noEmit` — ПРОХОДИТ
- [x] Тесты rai-chat — PASS

---

**Статус:** READY_FOR_REVIEW
