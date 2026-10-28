@echo off
REM Windows Script to Start Both Servers

echo ================================================
echo   DPDP Platform - Starting Development Servers
echo ================================================
echo.

REM Check if running from root directory
if not exist "backend\" (
    echo Error: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/2] Starting Backend Server (Port 3001)...
echo.
start "DPDP Backend" cmd /k "cd backend && npm run start:dev"

timeout /t 3 >nul

echo [2/2] Starting Frontend Server (Port 5173)...
echo.
start "DPDP Frontend" cmd /k "npm run dev"

echo.
echo ================================================
echo   Servers Starting...
echo ================================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Two terminal windows have been opened.
echo Press Ctrl+C in each terminal to stop servers.
echo.
pause
