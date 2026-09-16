@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to write prayers. Install its LTS version from nodejs.org.
  pause
  exit /b 1
)
echo Opening the prayer editor in your browser...
node tools/prayer-editor.cjs
pause
