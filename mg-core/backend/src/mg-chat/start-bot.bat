@echo off
echo ========================================
echo MG Chat Bot - Quick Start
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

echo.
echo [2/4] Starting server...
echo.
echo Server will start on http://localhost:3000
echo.
echo IMPORTANT: After server starts, you need to:
echo 1. Run ngrok in another terminal: ngrok http 3000
echo 2. Copy the HTTPS URL from ngrok
echo 3. Set webhook using the command shown below
echo.
echo ========================================
echo.

start cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo [3/4] Webhook Setup Instructions:
echo.
echo After getting your ngrok URL, run this command:
echo.
echo curl -X POST "https://api.telegram.org/bot[REDACTED]/setWebhook" -H "Content-Type: application/json" -d "{\"url\": \"https://YOUR_NGROK_URL/webhook/telegram\"}"
echo.
echo Replace YOUR_NGROK_URL with your actual ngrok URL
echo.
echo ========================================
echo.
echo [4/4] Testing:
echo.
echo Open Telegram and send a message to your bot!
echo.
echo Test messages:
echo - "что у меня сегодня"
echo - "мои задачи"
echo - "мой график"
echo.
echo ========================================
pause
