@echo off
REM ============================================================
REM  SSC Wet Check - one-click launcher (no install required)
REM  Double-click this file to start the app. Your browser opens
REM  automatically. Close this black window to stop the app.
REM ============================================================

cd /d "%~dp0"

set "PS=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
if not exist "%PS%" set "PS=powershell.exe"

if not exist "dist\index.html" goto no_build

"%PS%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
exit /b 0

:no_build
echo.
echo The app files (dist folder) were not found next to this launcher.
echo Looked in: %~dp0dist
echo Please tell Claude that the dist folder is missing.
echo.
pause
exit /b 1
