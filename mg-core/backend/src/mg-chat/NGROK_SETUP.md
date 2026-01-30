# Ngrok Setup Guide

## Проблема
Ngrok не установлен в системе.

## Решение 1: Установка через Chocolatey (рекомендуется)

### 1. Установить Chocolatey (если не установлен)

Запустите PowerShell **от имени администратора** и выполните:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### 2. Установить ngrok

```powershell
choco install ngrok -y
```

### 3. Перезапустить PowerShell

Закройте и откройте PowerShell заново, затем:

```bash
ngrok http 3001
```

---

## Решение 2: Скачать ngrok вручную

1. Перейдите на https://ngrok.com/download
2. Скачайте Windows версию (ZIP)
3. Распакуйте в `C:\ngrok\`
4. Добавьте `C:\ngrok\` в PATH или запускайте напрямую:

```bash
C:\ngrok\ngrok.exe http 3001
```

---

## Решение 3: Использовать локальный тест (без ngrok)

Для быстрого тестирования без webhook можно использовать **long polling**:

```bash
cd backend\src\mg-chat
node test-local.js
```

Этот скрипт будет опрашивать Telegram API напрямую (без webhook).

---

## После установки ngrok

1. Запустите ngrok:
```bash
ngrok http 3001
```

2. Скопируйте HTTPS URL (например: `https://abc123.ngrok.io`)

3. Настройте webhook:
```bash
cd backend\src\mg-chat
node setup-webhook.js https://abc123.ngrok.io/webhook/telegram
```

4. Тестируйте в Telegram!
