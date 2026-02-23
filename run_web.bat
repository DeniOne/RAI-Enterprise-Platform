@echo off
echo [RAI-EP] Starting FRONTEND (WEB)...
set NEXT_TELEMETRY_DISABLED=1
pnpm --filter web run dev
pause
