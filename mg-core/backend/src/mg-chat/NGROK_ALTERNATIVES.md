# ngrok Альтернативы

## Проблема
ngrok блокирует подключения с вашего IP адреса (37.212.56.109).

**Ошибка:**
```
ERROR: authentication failed: We do not allow agents to connect to ngrok from your IP address
ERROR: ERR_NGROK_9040
```

## Решения

### Вариант 1: Локальный тест (без webhook)

Используйте `test-local.js` для тестирования без внешнего доступа:

```bash
cd backend\src\mg-chat
node test-local.js
```

**Плюсы:**
- ✅ Работает без ngrok
- ✅ Полностью функционален
- ✅ Нет ограничений

**Минусы:**
- ❌ Не production-ready
- ❌ Long polling вместо webhook

---

### Вариант 2: Альтернативные туннели

#### localtunnel
```bash
npm install -g localtunnel
lt --port 3001
```

#### serveo.net
```bash
ssh -R 80:localhost:3001 serveo.net
```

#### cloudflared (Cloudflare Tunnel)
```bash
# Установка
choco install cloudflared -y

# Запуск
cloudflared tunnel --url http://localhost:3001
```

---

### Вариант 3: VPN + ngrok

Если у вас есть VPN, подключитесь через него и попробуйте ngrok снова.

---

### Вариант 4: Production Deployment

Разверните бота на реальном сервере:

- **Heroku** (бесплатный tier)
- **Railway.app** (бесплатный tier)
- **Render.com** (бесплатный tier)
- **VPS** (DigitalOcean, Linode, etc.)

---

## Рекомендация

**Для разработки:** Используйте `test-local.js` (long polling)

**Для production:** Разверните на реальном сервере с постоянным HTTPS URL

---

## Текущий статус

✅ TypeScript ошибки исправлены
✅ Сервер готов к запуску
❌ ngrok заблокирован для вашего IP
✅ test-local.js работает как альтернатива
