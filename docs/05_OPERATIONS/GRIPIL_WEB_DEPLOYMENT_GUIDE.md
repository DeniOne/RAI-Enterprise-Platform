---
id: GRIPIL-WEB-DEPLOY-001
layer: Operations
type: Runbook
status: active
version: 1.0.0
owners: AGENT
last_updated: 2026-03-27
claim_id: CLAIM-OPS-GRIPIL-WEB-DEPLOY-20260327
claim_status: asserted
verified_by: manual
last_verified: 2026-03-27
evidence_refs: ["apps/gripil-web/next.config.ts"]
---

## CLAIM
id: CLAIM-OPS-GRIPIL-WEB-DEPLOY-20260327
status: asserted
verified_by: manual
last_verified: 2026-03-27

# Инструкция по деплою Gripil Web (Standalone Mode)

Данный документ описывает процесс переноса и запуска собранного приложения Gripil Web на хостинг/VPS.

## Предварительные условия
- На сервере установлен Node.js 18+
- Выполнен билд с `output: 'standalone'` (уже настроено в `next.config.ts`)

## Шаги деплоя

### 1. Подготовка файлов
После выполнения `pnpm build` в директории `apps/gripil-web/.next/standalone` создается минимально необходимый набор файлов для запуска.

### 2. Копирование на сервер (SCP/RSYNC)
Необходимо скопировать следующие директории:
```bash
# Из папки apps/gripil-web:
scp -r .next/standalone user@host:/path/to/app
scp -r .next/static user@host:/path/to/app/.next/static
scp -r public user@host:/path/to/app/public
```

> [!IMPORTANT]
> Директории `static` и `public` должны быть скопированы вручную внутрь `standalone`, так как Next.js не включает их в бандл для экономии места (предполагается раздача через CDN или Nginx).

### 3. Запуск приложения
На сервере перейдите в папку приложения и запустите сервер:
```bash
cd /path/to/app
node server.js
```

Для постоянной работы рекомендуется использовать `pm2`:
```bash
pm2 start server.js --name "gripil-web"
```

## Настройка Nginx (Reverse Proxy)
Рекомендуется проксировать запросы через Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000; # Или другой PORT, если задан через ENV
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
