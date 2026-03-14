---
id: DOC-ENG-04-ENGINEERING-SECURITY-THREAT-MODEL-STRID-10G2
layer: Engineering
type: Database Spec
status: draft
version: 0.1.0
---
# Моделирование угроз (STRIDE) - Critical Paths

**Дата:** 2026-02-16
**Статус:** Draft / Baseline
**Контур:** Critical Invariants (Multi-tenancy, Finance, Execution)

## 1. Методология
Анализ проводится по модели **STRIDE**:
- **S**poofing (Подмена личности)
- **T**ampering (Подмена данных)
- **R**epudiation (Отказ от авторства)
- **I**nformation Disclosure (Раскрытие данных)
- **D**enial of Service (Отказ в обслуживании)
- **E**levation of Privilege (Повышение привилегий)

---

## 2. Анализ критических потоков

### A. Tenant Data Access (Multi-tenancy)
*Контекст: Доступ пользователя к ресурсам (Fields, Accounts).*

| Угроза | Описание сценария | Вероятность | Ущерб | Mitigations (Принятые меры) | Статус |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Атакующий подделывает JWT токен другого тенанта. | Low | Critical | Подпись RS256/HS256, валидация `companyId` в payload. | ✅ Closed |
| **Tampering** | Модификация `companyId` в URL/Body при запросе. | High | Critical | **Tenant Middleware**: принудительная перезапись `where` условий в Prisma. | ✅ Closed (Week 1) |
| **Info Disclosure** | Утечка данных чужого тенанта через API (IDOR). | Medium | Critical | **Fail-closed middleware**, запрет запросов без контекста. | ✅ Closed (Week 1) |
| **Elevation** | Пользователь с ролью `VIEWER` выполняет `WRITE`. | Medium | High | ⚠️ **OPEN**: Отсутствует строгий RBAC на всех эндпоинтах. | 🔴 **TODO (Next)** |

### B. Financial Ledger (Double Entry)
*Контекст: Проводки, балансы, начисление зарплат.*

| Угроза | Описание сценария | Вероятность | Ущерб | Mitigations (Принятые меры) | Статус |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tampering** | Прямое изменение баланса в БД мимо лога проводок. | Low (Internal) | Critical | **Immutability Triggers**: запрет UPDATE/DELETE на `LedgerEntry`. | ✅ Closed (Week 1) |
| **Repudiation** | "Я не создавал эту проводку". | Medium | High | **Audit Log**: фиксация `userId`, `ip`, `reason`. | ✅ Closed |
| **Tampering** | Race Condition: списание средств дважды. | Medium | High | **Optimistic Locking** (`version`), Idempotency Keys. | ✅ Closed (Week 1) |

### C. Execution Engine (Agro Operations)
*Контекст: Списание ТМЦ (семена, химия) при выполнении работ.*

| Угроза | Описание сценария | Вероятность | Ущерб | Mitigations (Принятые меры) | Статус |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Spoofing** | Фиктивный отчет о выполнении работы (списание ТМЦ "налево"). | High (Fraud) | Medium | Требование подтверждения, гео-валидация (в планах). | 🟡 Partial |
| **Tampering** | Изменение норм внесения в техкарте задним числом. | Medium | High | Версионирование техкарт, блокировка изменений в активном сезоне. | ✅ Closed |

---

## 3. План устранения уязвимостей (Remediation Plan)

### Приоритет P0 (Блокирующие)
1.  **RBAC Enforcement**: Закрыть риск *Elevation of Privilege*. Внедрить `RolesGuard` на все контроллеры.
    *   *Связь с чеклистом:* "Внедрить strict authz (least privilege)"
2.  **Infrastructure Protection**: Закрыть риск *Denial of Service*. Внедрить Rate Limiting.
    *   *Связь с чеклистом:* "Включить WAF/rate limiting"

### Приоритет P1 (Критические)
1.  **Secret Rotation**: Уменьшить impact от утечки админских кредов.
    *   *Связь с чеклистом:* "Централизовать секреты и ротацию"

## Заключение
Наибольший незакрытый вектор атаки на данный момент — **Elevation of Privilege** внутри тенанта (проблема авторизации) и **DoS** (отсутствие лимитов). Фундаментальная изоляция данных (Information Disclosure между тенантами) закрыта успешно.
