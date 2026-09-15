@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to update the website. Install its LTS version from nodejs.org.
  pause
  exit /b 1
)
node tools/update-site.cjs
if errorlevel 1 (
  echo The update stopped. Review the message above before committing.
  pause
  exit /b 1
)
node tools/validate-site.cjs
if errorlevel 1 (
  echo Please fix the reported issue before committing.
) else (
  echo Website updated and checked. Commit all changes in github-site to publish.
)
pause
