@echo off
setlocal

cd /d "%~dp0"
set "NEXT_BIN=%~dp0node_modules\next\dist\bin\next"
set "PORT=3000"

echo [1/4] Cleaning previous build...
if exist ".next" rmdir /s /q ".next"

echo.
echo [2/4] Building the app...
node "%NEXT_BIN%" build
if errorlevel 1 (
  echo.
  echo Build failed. Press any key to close.
  pause >nul
  exit /b 1
)

echo.
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul
if not errorlevel 1 (
  echo Port 3000 is already in use. Falling back to 3001.
  set "PORT=3001"
)

echo [3/4] Starting the app on http://localhost:%PORT% ...
echo Keep this window open while using the app.
echo Open a new browser tab after the server starts.
echo.

node "%NEXT_BIN%" start -p %PORT%

echo.
echo [4/4] Server stopped.
echo Server stopped. Press any key to close.
pause >nul
