@echo off
cd /d f:\RAI_EP\packages\prisma-client
echo Starting batch script > debug_run.log
call node_modules\.bin\tsx.cmd seed.ts >> debug_run.log 2>&1
if %errorlevel% neq 0 (
  echo Error %errorlevel% >> debug_run.log
)
echo Directory listing: >> debug_run.log
dir >> debug_run.log
type seed_debug.log >> debug_run.log 2>&1
echo Done >> debug_run.log
