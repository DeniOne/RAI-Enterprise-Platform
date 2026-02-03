@echo off
chcp 65001 > nul
title RAI_EP Telegram Bot Launcher

echo ==========================================
echo    🚀 RAI_EP Telegram Bot Launcher
echo ==========================================

echo 🔍 Проверка Docker...
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker не обнаружен или не запущен.
    echo [!] Убедись, что Docker Desktop запущен.
    echo.
    set /p start_docker="Попробовать запустить Docker? (y/n): "
    if /i "%start_docker%"=="y" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo Ожидание запуска Docker (30 сек)...
        timeout /t 30 /nobreak
    ) else (
        echo [!] Продолжаем на свой страх и риск...
    )
)

echo 🛠️ Поднимаем инфраструктуру (Postgres, Redis)...
call pnpm docker:up

echo 📦 Проверка зависимостей и БД...
cd apps\api
call pnpm install
call npx prisma generate --schema=../../packages/prisma-client/schema.prisma

echo 🤖 Запуск Telegram Бота...
echo.
call pnpm run start:dev

pause
