# Production Deployment Guide

## Шаг 1: Установка ngrok

### ⚠️ Важно: Chocolatey требует прав администратора

Рекомендуем **ручную установку** (проще и быстрее):

### Вариант A: Ручная установка (РЕКОМЕНДУЕТСЯ)

1. **Скачайте ngrok**:
   - Перейдите на https://ngrok.com/download
   - Нажмите "Download for Windows"
   - Скачается файл `ngrok-v3-stable-windows-amd64.zip`

2. **Распакуйте**:
   - Создайте папку `C:\ngrok\`
   - Распакуйте `ngrok.exe` в эту папку

3. **Проверьте установку**:
```bash
C:\ngrok\ngrok.exe version
```

4. **Используйте ngrok**:
```bash
C:\ngrok\ngrok.exe http 3001
```

### Вариант B: Через Chocolatey (требует администратора)

1. **Откройте PowerShell ОТ ИМЕНИ АДМИНИСТРАТОРА**
2. **Установите ngrok**:
```powershell
choco install ngrok -y
```
3. **Перезапустите PowerShell** (обычный)

---

## Шаг 2: Запуск Production Сервера

1. **Остановите test-local.js** (если запущен):
   - Нажмите `Ctrl+C` в терминале

2. **Запустите production сервер**:
```bash
cd backend\src\mg-chat
npm run dev
```

Должны увидеть:
```
[MG Chat Server] ✅ Contracts initialized
[MG Chat Server] 🚀 Server running on port 3001
[MG Chat Server] 📡 Webhook endpoint: http://localhost:3001/webhook/telegram
```

---

## Шаг 3: Запуск ngrok

**В новом терминале:**

```bash
ngrok http 3001
```

Вы увидите:
```
Session Status                online
Account                       [your account]
Forwarding                    https://abc123.ngrok.io -> http://localhost:3001
```

**Скопируйте HTTPS URL** (например: `https://abc123.ngrok.io`)

---

## Шаг 4: Настройка Webhook

**В третьем терминале:**

```bash
cd backend\src\mg-chat
node setup-webhook.js https://abc123.ngrok.io/webhook/telegram
```

Должны увидеть:
```
✅ Webhook set successfully!
   URL: https://abc123.ngrok.io/webhook/telegram
```

---

## Шаг 5: Тестирование

1. **Откройте Telegram**
2. **Отправьте сообщение боту**: `что у меня сегодня`
3. **Проверьте логи сервера** — должны увидеть:
```
[Telegram Webhook] Received update: 123456
[Telegram Webhook] Processing text message
```

4. **Нажмите на кнопку** в ответе бота
5. **Проверьте callback** в логах:
```
[Telegram Webhook] Processing callback query
```

---

## Шаг 6: Проверка Webhook Status

```bash
node -e "require('axios').get('https://api.telegram.org/bot[REDACTED]/getWebhookInfo').then(r => console.log(JSON.stringify(r.data.result, null, 2)))"
```

Должны увидеть:
```json
{
  "url": "https://abc123.ngrok.io/webhook/telegram",
  "has_custom_certificate": false,
  "pending_update_count": 0,
  "last_error_date": 0
}
```

---

## Troubleshooting

### Ошибка: ngrok не найден
- Перезапустите PowerShell после установки
- Или используйте полный путь: `C:\ngrok\ngrok.exe http 3001`

### Ошибка 409 (Conflict)
- Удалите webhook: `node delete-webhook.js`
- Остановите все процессы: `taskkill /F /IM node.exe`
- Запустите заново

### Webhook не работает
- Проверьте, что сервер запущен на порту 3001
- Проверьте, что ngrok показывает "online"
- Проверьте URL в webhook (должен быть HTTPS)

### Сервер не отвечает
- Проверьте логи сервера
- Проверьте, что порт 3001 свободен
- Перезапустите сервер

---

## Production Checklist

- [ ] ngrok установлен и работает
- [ ] Сервер запущен на порту 3001
- [ ] ngrok forwarding активен
- [ ] Webhook настроен с HTTPS URL
- [ ] Тестовое сообщение работает
- [ ] Callback кнопки работают
- [ ] Логи показывают корректную обработку

---

## Автоматизация (опционально)

Создайте `start-production.bat`:

```batch
@echo off
echo Starting MG Chat Production...

REM Terminal 1: Server
start "MG Chat Server" cmd /k "cd backend\src\mg-chat && npm run dev"

timeout /t 3 /nobreak >nul

REM Terminal 2: ngrok
start "ngrok" cmd /k "ngrok http 3001"

echo.
echo ========================================
echo Production servers started!
echo.
echo Next steps:
echo 1. Copy HTTPS URL from ngrok window
echo 2. Run: node setup-webhook.js https://YOUR_URL/webhook/telegram
echo ========================================
pause
```

---

## Готово! 🚀

Ваш MG Chat бот теперь работает в production mode с webhook!
