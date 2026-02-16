# Политика управления секретами и ротации (Secret Management Policy)

**ID:** DOC-SEC-POL-001
**Статус:** Draft
**Дата:** 2026-02-16

## 1. Классификация секретов

| Тип | Примеры | Уровень риска | Период ротации | Метод хранения |
| :--- | :--- | :--- | :--- | :--- |
| **Infrastructure** | `DATABASE_URL`, `REDIS_URL` | Critical | 90 дней | Environment Rules / Vault |
| **Application** | `JWT_SECRET`, `API_KEYS` | Critical | 30 дней | Environment Rules / Vault |
| **Integration** | `TELEGRAM_BOT_TOKEN`, `SATELLITE_API_KEY` | High | 180 дней | Environment Rules / Vault |
| **Internal** | Service-to-Service tokens | Medium | При релизе | HashiCorp Vault (Target) |

## 2. Принципы хранения
1.  **Никаких секретов в коде.** Hardcode запрещен.
2.  **.env файлы не коммитятся.** Добавлены в `.gitignore`.
3.  **Принцип наименьших привилегий.** Секреты выдаются только тем сервисам, которым они нужны (через env injection).

## 3. Процедура ротации (Rotation Procedure)

### JWT Secret Check (Monthly)
1.  Сгенерировать новый `JWT_SECRET` (openssl rand -hex 64).
2.  Обновить `.env` на всех нодах `api`.
3.  *Impact:* Все текущие сессии пользователей будут сброшены (Force Logout).
4.  Выполнять в окно обслуживания (Maintenance Window).

### Database Credentials (Quarterly)
1.  Создать нового пользователя БД с аналогичными правами.
2.  Обновить `DATABASE_URL` в приложении (Blue/Green deployment).
3.  Убедиться, что приложение работает.
4.  Удалить/отключить старого пользователя БД.

## 4. Leakage Protocol (Что делать при утечке)
1.  **Изоляция:** Немедленно заблокировать скомпрометированный ключ/токен.
2.  **Ротация:** Выпустить новый секрет.
3.  **Аудит:** Проверить логи (`AgroAudit`, `SystemLogs`) на предмет несанкционированного доступа с использованием утекшего ключа.
