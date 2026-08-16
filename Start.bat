@echo off
setlocal enabledelayedexpansion

:: Force working directory to script location
cd /d "%~dp0"

:: ============================================================================
::  Localhost Server Launcher
:: ============================================================================

title Localhost Server Launcher
color 0B

:check_prereqs
echo ============================================================================
echo   Localhost Server Launcher
echo ============================================================================
echo.
echo [1/3] Running Pre-flight Environment Checks...

set "NEEDS_SETUP=0"

if not exist "node_modules" set "NEEDS_SETUP=1"
if not exist ".env" set "NEEDS_SETUP=1"
if not exist "dist\server.cjs" set "NEEDS_SETUP=1"

if not exist "data" mkdir "data" >nul 2>&1
if not exist "logs" mkdir "logs" >nul 2>&1
if not exist "uploads" mkdir "uploads" >nul 2>&1

if "%NEEDS_SETUP%"=="1" (
    color 0E
    echo.
    echo ============================================================================
    echo [ACTION REQUIRED] Prerequisites or compiled bundles are missing.
    echo Running environment setup automatically via Setup.bat...
    echo ============================================================================
    echo.
    call "%~dp0Setup.bat" --no-pause
    if !errorlevel! neq 0 (
        color 0C
        echo [ERROR] Setup failed. Please resolve setup issues before launching.
        pause
        exit /b 1
    )
    color 0B
)

echo  [OK] Environment verified successfully.
echo.

:menu
cls
echo ============================================================================
echo   Localhost Server Launcher
echo ============================================================================
echo   Status: Localhost server engine ready.
echo   Target URL: http://localhost:3000
echo.
echo   Select Execution Option:
echo.
echo   [1] Run Localhost (Node.js engine on http://localhost:3000)
echo   [2] Run Docker    (Containerized engine via Docker Compose)
echo   [3] Run Setup     (Run environment setup ^& dependency checker)
echo   [4] Exit
echo ============================================================================
set "CHOICE="
set /p CHOICE="Enter choice [1-4]: "

if "!CHOICE!"=="1" goto LAUNCH_NODE
if "!CHOICE!"=="2" goto LAUNCH_DOCKER
if "!CHOICE!"=="3" goto LAUNCH_SETUP
if "!CHOICE!"=="4" goto EXIT_APP

echo.
echo [ERROR] Invalid choice '!CHOICE!'. Please enter 1, 2, 3, or 4.
timeout /t 2 >nul
goto menu

:: ============================================================================
:: OPTION 1: RUN LOCALHOST (NODE.JS)
:: ============================================================================
:LAUNCH_NODE
cls
echo ============================================================================
echo [OPTION 1] Launching Local Server via Node.js...
echo ============================================================================

where node >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js was not found on your system PATH!
    echo Please download and install Node.js from https://nodejs.org/
    echo.
    pause
    goto menu
)

if not exist "dist\server.cjs" (
    echo [INFO] Production bundle dist\server.cjs missing. Compiling now...
    call npm run build
)

echo.
echo [2/3] Registering Automatic Browser Opener...
timeout /t 2 >nul
start "" "http://localhost:3000"

echo.
echo [3/3] Starting Local Server Engine...
echo ============================================================================
echo   SERVER RUNNING AT: http://localhost:3000
echo ============================================================================
echo   - Web Console ^& API Endpoint : http://localhost:3000
echo   - Local Data Directory       : ./data/
echo   - Press Ctrl+C to stop the server cleanly.
echo ============================================================================
echo.

if exist "dist\server.cjs" (
    call npm start
) else (
    call npm run dev
)

goto END_PROMPT

:: ============================================================================
:: OPTION 2: RUN DOCKER
:: ============================================================================
:LAUNCH_DOCKER
cls
echo ============================================================================
echo [OPTION 2] Launching Local Server via Docker Compose...
echo ============================================================================

where docker >nul 2>&1
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Docker executable not found in system PATH.
    echo Please start Docker Desktop or select Option 1 (Run Localhost).
    echo.
    pause
    goto menu
)

echo Building and starting Docker container engine on http://localhost:3000 ...
echo [2/3] Registering Automatic Browser Opener...
timeout /t 2 >nul
start "" "http://localhost:3000"

echo.
echo [3/3] Starting Docker Container Engine...
where docker-compose >nul 2>&1
if %errorlevel% equ 0 (
    call docker-compose up --build
) else (
    call docker compose up --build
)

goto END_PROMPT

:: ============================================================================
:: OPTION 3: RUN SETUP
:: ============================================================================
:LAUNCH_SETUP
call "%~dp0Setup.bat"
goto menu

:END_PROMPT
echo.
echo ============================================================================
echo Localhost Server Engine stopped.
echo Click or press any key to close this window.
echo ============================================================================
pause
exit /b 0

:EXIT_APP
exit /b 0
