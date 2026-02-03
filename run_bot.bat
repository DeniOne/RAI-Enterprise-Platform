@echo off
title RAI_EP Telegram Bot Launcher

echo [DEBUG] Script started. Press any key to continue...
pause

echo CHECKING DOCKER...
docker ps > nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Docker not found or not running.
    echo [!] Please start Docker Desktop.
    pause
    goto CHECK_APPS
)

echo STARTING INFRASTRUCTURE...
call pnpm docker:up
if %errorlevel% neq 0 (
    echo [!] Error starting Docker Compose.
    pause
)

:CHECK_APPS
echo CHECKING API FOLDER...
if not exist "apps\api" (
    echo [!] Error: Folder apps\api not found!
    pause
    exit /b 1
)

cd apps\api
echo [DEBUG] Entered apps\api.

echo INSTALLING DEPENDENCIES...
call pnpm install
if %errorlevel% neq 0 (
    echo [!] Error during pnpm install.
    pause
)

echo GENERATING PRISMA CLIENT...
call npx prisma generate --schema=../../packages/prisma-client/schema.prisma
if %errorlevel% neq 0 (
    echo [!] Error during Prisma Generate.
    pause
)

echo STARTING BOT...
call pnpm run start:dev
if %errorlevel% neq 0 (
    echo [!] Bot crashed or stopped with error.
    pause
)

echo [DEBUG] Execution finished.
pause
