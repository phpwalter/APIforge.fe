@echo off
cls

call npm run build

if errorlevel 1 (
  echo BUILD FAILED
  pause
  exit /b 1
)

taskkill /F /IM node.exe

call npm run dev -- --port 5173 --strictPort