@echo off
title RAI_EP Full Stack Launcher

echo [1/5] STARTING INFRASTRUCTURE (DOCKER)...
call pnpm docker:up
if %errorlevel% neq 0 (
    echo [!] Error starting Docker. Ensure Docker Desktop is running.
    pause
)

echo [2/5] GENERATING PRISMA CLIENT...
cd packages/prisma-client
call npx prisma generate
cd ../..

echo [3/5] STARTING BACKEND API...
start "RAI_EP Backend API" cmd /k "cd apps/api && pnpm run start:dev"

echo [4/5] STARTING TELEGRAM BOT...
start "RAI_EP Telegram Bot" cmd /k "cd apps/telegram-bot && pnpm run start:dev"

echo [5/5] STARTING FRONTEND (WEB)...
start "RAI_EP Frontend" cmd /k "cd apps/web && pnpm run dev"

echo ==========================================
echo ✅ ALL SYSTEMS STARTING...
echo ------------------------------------------
echo Backend API: http://localhost:4000
echo Telegram Bot: http://localhost:4002 (microservice)
echo Frontend Web: http://localhost:3000
echo ==========================================
echo NOTE: Backend and Bot are now SEPARATE processes
echo ==========================================
pause
