@echo off
echo [RAI-EP] Starting BACKEND (API)...
set NEXT_TELEMETRY_DISABLED=1
pnpm --filter api run start:dev
pause
