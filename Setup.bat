@echo off
setlocal enabledelayedexpansion

:: Force working directory to script location
cd /d "%~dp0"

:: Parse flag for automated execution without pause
set "NO_PAUSE=0"
if "%~1"=="--no-pause" set "NO_PAUSE=1"

:: ============================================================================
::  Environment Setup & Dependency Checker
:: ============================================================================

title Environment Setup & Dependency Checker
color 0A

echo ============================================================================
echo   System Setup & Environment Gap Fulfilling Engine
echo ============================================================================
echo.

:: ----------------------------------------------------------------------------
:: 1. PREREQUISITE CHECKS
:: ----------------------------------------------------------------------------
echo [1/5] Checking System Prerequisites...

set "MISSING_DEPS=0"

where node >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('node -v 2^>^&1') do echo  [OK] Node.js %%v detected.
) else (
    echo  [MISSING] Node.js is not installed or not on PATH!
    echo            Please download and install Node.js from: https://nodejs.org/
    set "MISSING_DEPS=1"
)

where npm >nul 2>&1
if %errorlevel% equ 0 (
    for /f "tokens=*" %%v in ('npm -v 2^>^&1') do echo  [OK] npm v%%v detected.
) else (
    echo  [MISSING] npm is not installed or not on PATH!
    echo            Please download and install Node.js/npm from: https://nodejs.org/
    set "MISSING_DEPS=1"
)

if "%MISSING_DEPS%"=="1" goto ERR_MISSING_PREREQ

echo.

:: ----------------------------------------------------------------------------
:: 2. ENVIRONMENT & STORAGE GAP FULFILLMENT
:: ----------------------------------------------------------------------------
echo [2/5] Fulfilling Storage Directories & Environment Configuration Gaps...

if not exist "data" mkdir "data" >nul 2>&1
if not exist "logs" mkdir "logs" >nul 2>&1
if not exist "uploads" mkdir "uploads" >nul 2>&1

:: Environment file fulfillment (.env)
if not exist ".env" (
    if exist ".env.example" (
        echo  Creating .env from .env.example...
        copy /y ".env.example" ".env" >nul
    ) else (
        echo  Generating default .env configuration file...
        (
            echo PORT=3000
            echo HOST=0.0.0.0
            echo NODE_ENV=development
        ) > ".env"
    )
    echo  [OK] Environment file .env fulfilled.
) else (
    echo  [OK] Environment file .env verified.
)

echo.

:: ----------------------------------------------------------------------------
:: 3. AUTOMATIC DEPENDENCY INSTALLATION
:: ----------------------------------------------------------------------------
echo [3/5] Verifying & Installing npm Dependencies...

set "RUN_INSTALL=0"
if not exist "node_modules" (
    set "RUN_INSTALL=1"
) else (
    node -e "try { require('express'); } catch(e) { process.exit(1); }" >nul 2>&1
    if !errorlevel! neq 0 (
        echo  [INFO] Core modules missing in node_modules. Installing...
        set "RUN_INSTALL=1"
    )
)

if "%RUN_INSTALL%"=="1" (
    echo  Installing dependencies via npm install...
    call npm install
    if !errorlevel! neq 0 (
        color 0C
        echo.
        echo [ERROR] npm package installation failed.
        echo Please check your internet connection or npm configuration.
        if "%NO_PAUSE%"=="0" pause
        exit /b 1
    )
    echo  [OK] All npm dependencies installed successfully.
) else (
    echo  [OK] Required npm packages are installed.
)

echo.

:: ----------------------------------------------------------------------------
:: 4. AUTOMATIC BUILD & COMPILATION
:: ----------------------------------------------------------------------------
echo [4/5] Compiling Production Bundle (npm run build)...

if exist "package.json" (
    call npm run build
    if !errorlevel! neq 0 (
        echo  [WARNING] Production build encountered issues. Retrying build...
        call npm run build
    ) else (
        echo  [OK] Production server bundle compiled successfully to ./dist/server.cjs
    )
)

echo.

:: ----------------------------------------------------------------------------
:: 5. SYSTEM VALIDATION & CLEAN EXIT
:: ----------------------------------------------------------------------------
echo [5/5] Pre-flight System Validation...

if exist "dist\server.cjs" (
    echo  [OK] Production bundle dist\server.cjs present.
) else (
    echo  [WARNING] dist\server.cjs not found. Local dev server mode can still be used.
)

echo.
color 0A
echo ============================================================================
echo   SUCCESS! Environment & Dependency Setup Complete.
echo ============================================================================
echo   - Config File  : ./.env
echo   - Data Storage : ./data
echo   - App Bundle   : ./dist/server.cjs
echo.
echo   You can now launch the platform by executing Start.bat
echo ============================================================================
echo.

if "%NO_PAUSE%"=="0" (
    echo Press any key to close this setup window...
    pause >nul
)

exit /b 0

:ERR_MISSING_PREREQ
color 0C
echo.
echo ============================================================================
echo [CRITICAL ERROR] Core prerequisites (Node.js / npm) are missing!
echo Please install Node.js LTS (v18+) from https://nodejs.org/ and re-run Setup.bat
echo ============================================================================
echo.
if "%NO_PAUSE%"=="0" pause
exit /b 1
