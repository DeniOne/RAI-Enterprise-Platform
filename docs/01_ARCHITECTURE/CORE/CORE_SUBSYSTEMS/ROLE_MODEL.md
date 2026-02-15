---
id: control-role-model
type: HLD
layer: Architecture
status: approved
version: 1.0.0
owners: [architects, product-owner]
depends_on: [control-admission-policy]
---

# Subsystem: Role Model (RBAC) 🎭

> **Статус:** Канон | **Версия:** 1.0 | **Расположение:** Business Core

---

## 1. Назначение
Определяет, какие действия разрешены пользователям в зависимости от их функциональных обязанностей. Мы используем гибридную модель: **Role-Based Access Control (RBAC)** с учетом контекста компании.

---

## 2. Основные роли (Alpha)

| Роль | Описание | Основные права |
|------|----------|----------------|
| **OWNER** | Владелец компании | Полный доступ, управление финансами, удаление компании. |
| **MANAGER** | Главный агроном / Директор | Управление техкартами, назначение задач, просмотр всей аналитики. |
| **AGRONOMIST** | Полевой специалист | Просмотр полей, фиксация факта работ, получение задач в боте. |
| **GUEST** | Временный доступ | Только просмотр разрешенных полей (без истории). |

---

## 3. Матрица разрешений (CRUD)

| Сущность | Owner | Manager | Agronomist |
|----------|:---:|:---:|:---:|
| Компания | CRUD | R | R |
| Поле | CRUD | CRUD | R |
| Сезон | CRUD | CRUD | RU |
| Задача | CRUD | CRUD | RU |
| Аудит | R | R | - |

*R - Read, U - Update, C - Create, D - Delete*

---

## 4. Контекстная авторизация
Пользователь может иметь разные роли в разных компаниях. При переключении "Базы" (Immersion Context) система подгружает соответствующий набор Permissions.

---

## 5. Реализация в коде
В NestJS используются Guard'ы:
- `@Roles(UserRole.MANAGER)` — проверка базовой роли.
- `MultitentacyGuard` — проверка, что `companyId` в запросе совпадает с `companyId` в токене пользователя.

---

## 6. Phase Beta+: Role Rank & Module Access Policy (Fixation 2026-02-09)

### 6.1 Role ranks
- `SYSTEM_ADMIN`: системный администратор (управление ролями и доступами).
- `FOUNDER`: учредитель (полный бизнес-доступ).
- `CEO`: генеральный директор (полный бизнес-доступ).
- `DIRECTOR_HR`: директор/руководитель HR-направления.
- `DIRECTOR_OFS`: директор/руководитель OFS-направления.
- `DIRECTOR_ECONOMY`: директор/руководитель экономики.
- `DIRECTOR_FINANCE`: директор/руководитель финансов.
- `DIRECTOR_GR`: директор/руководитель GR.
- `DIRECTOR_PRODUCTION`: директор/руководитель производства.
- `MANAGER`: менеджер консалтинга.
- `AGRONOMIST`: агрономическая служба.

### 6.2 Sidebar visibility by role

| Role | Visible modules in sidebar |
|------|----------------------------|
| `SYSTEM_ADMIN` | `CMR`, `HR`, `ОФС`, `Экономика`, `Финансы`, `GR`, `Производство` + IAM/Admin |
| `FOUNDER` | `CMR`, `HR`, `ОФС`, `Экономика`, `Финансы`, `GR`, `Производство` |
| `CEO` | `CMR`, `HR`, `ОФС`, `Экономика`, `Финансы`, `GR`, `Производство` |
| `DIRECTOR_HR` | `HR` |
| `DIRECTOR_OFS` `DIRECTOR_HR` | `ОФС` |
| `DIRECTOR_ECONOMY` | `Экономика` |
| `DIRECTOR_FINANCE` | `Финансы` |
| `DIRECTOR_GR` | `GR` |
| `DIRECTOR_PRODUCTION` | `Производство` |
| `MANAGER` | `CMR` + Front-office links |
| `AGRONOMIST` | `CMR` + Front-office links |

`Front-office links` means contextual operational references inside CMR workflows (tasks/fields/tech-map/orchestrator context), not full back-office module access.

### 6.3 Canonical module order for full-access roles
1. `CMR`
2. `HR`
3. `ОФС`
4. `Экономика`
5. `Финансы`
6. `GR`
7. `Производство`

### 6.4 Enforcement requirements
- Role policy must be enforced at two layers:
  - UI layer: role-based sidebar and route visibility.
  - API layer: RBAC guards on endpoints.
- UI-only hiding without API authorization checks is prohibited.

## 7. Role assignment and change policy

### 7.1 Assignment at registration
- New user registration creates account with state `PENDING_ROLE`.
- User gets no business module access until role assignment is completed.
- Initial role assignment is allowed only for `SYSTEM_ADMIN`.

### 7.2 Role change policy
- Role changes are allowed only for `SYSTEM_ADMIN`.
- Self role-change is prohibited for all roles.
- `FOUNDER`, `CEO`, directors, managers, agronomists cannot assign or change roles.

### 7.3 Audit requirements
- Every assignment/change must be audit-logged with:
  - actorId
  - targetUserId
  - previousRole
  - newRole
  - timestamp
  - reason
