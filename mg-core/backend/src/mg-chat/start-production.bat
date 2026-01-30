@echo off
echo ========================================
echo MG Chat Production Deployment
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Starting MG Chat Server...
start "MG Chat Server" cmd /k "npm run dev"

timeout /t 3 /nobreak >nul

echo [2/3] Starting ngrok...
start "ngrok Tunnel" cmd /k "ngrok http 3001"

echo.
echo ========================================
echo Production servers started!
echo ========================================
echo.
echo Next steps:
echo.
echo 1. Wait for ngrok to start (check ngrok window)
echo 2. Copy the HTTPS URL from ngrok (e.g., https://abc123.ngrok.io)
echo 3. Run this command:
echo.
echo    node setup-webhook.js https://YOUR_NGROK_URL/webhook/telegram
echo.
echo Replace YOUR_NGROK_URL with the actual URL from ngrok
echo.
echo ========================================
echo.
pause
