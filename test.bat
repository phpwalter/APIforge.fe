@echo off
cls

call npm run build

if errorlevel 1 (
  echo BUILD FAILED
  exit /b 1
)

call npm test

