# MG Chat Testing Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend/src/mg-chat
npm install
```

### 2. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

### 3. Expose Webhook (ngrok)

В новом терминале:

```bash
ngrok http 3001
```

Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)

### 4. Set Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot[REDACTED]/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://YOUR_NGROK_URL/webhook/telegram"}'
```

Замените `YOUR_NGROK_URL` на ваш ngrok URL.

### 5. Test Bot

Откройте Telegram и найдите вашего бота.

**Test Cases:**

1. **Text Message:**
   - Отправьте: `что у меня сегодня`
   - Ожидается: Intent resolution + response

2. **Empty Message:**
   - Отправьте: ` ` (пробелы)
   - Ожидается: Error UX (empty_message)

3. **Unknown Intent:**
   - Отправьте: `абракадабра`
   - Ожидается: Fallback UX

4. **Callback:**
   - Нажмите на кнопку в ответе
   - Ожидается: Action dispatch + new response

---

## 🧪 Manual Testing Checklist

### Text Messages

- [ ] `что у меня сегодня` → Intent: get_my_day
- [ ] `мои задачи` → Intent: my_tasks
- [ ] `мой график` → Intent: my_shifts
- [ ] ` ` (empty) → Error: empty_message
- [ ] `абракадабра` → Fallback: unknown_intent

### Callbacks

- [ ] Click "📋 Задачи" → Action: my_tasks
- [ ] Click "🗓 График" → Action: my_shifts
- [ ] Click "🎯 Фокус" → Action: focus_mode

### Error Handling

- [ ] Spam (3x same message) → Error: spam_repetition
- [ ] Profanity → Error: aggression_detected

---

## 📊 Monitoring

### Server Logs

```bash
[MG Chat Server] ✅ Contracts initialized
[MG Chat Server] 🚀 Server running on port 3000
[Telegram Webhook] Received update: 123456
[Telegram Webhook] Processing text message
[Action Dispatcher] Dispatching: my_tasks
```

### Health Check

```bash
curl http://localhost:3000/health
```

Expected:
```json
{
  "status": "ok",
  "service": "mg-chat"
}
```

---

## 🐛 Troubleshooting

### Bot не отвечает

1. Проверьте server logs
2. Проверьте ngrok URL
3. Проверьте webhook: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Contracts не загружаются

1. Проверьте `documentation/ai/mg-chat/*.json`
2. Запустите: `npm run lint:mg-chat`
3. Проверьте schemas в `documentation/ai/mg-chat/schemas/`

### Telegram API errors

1. Проверьте token в `.env`
2. Проверьте network connectivity
3. Проверьте Telegram API status

---

## 🔧 Development Commands

```bash
# Start dev server
npm run dev

# Run linter
npm run lint:mg-chat

# Build for production
npm run build

# Start production
npm start
```

---

## 📝 Next Steps

1. ✅ Test basic text messages
2. ✅ Test callback queries
3. ✅ Test error handling
4. ⏳ Add logging/analytics
5. ⏳ Deploy to production
