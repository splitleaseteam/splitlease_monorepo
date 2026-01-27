@echo off
REM Visual Validation Runner - Windows
REM Simplified script to run the complete visual validation process
REM
REM Usage: run-visual-validation.bat

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo   VISUAL VALIDATION - 12 ADMIN PAGES
echo ============================================================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found
    exit /b 1
)
echo [OK] Node.js found

where npx >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm not found
    exit /b 1
)
echo [OK] npm found

REM Check if Playwright is installed
npx playwright --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Playwright...
    call npm install -D playwright
)
echo [OK] Playwright available

echo.
echo Checking dev server...

REM Check if dev server is running
powershell -Command "try { $null = Invoke-WebRequest http://localhost:8001 -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }"
if %errorlevel% equ 0 (
    echo [OK] Dev server already running on :8001
) else (
    echo [WARNING] Dev server not running
    echo.
    echo Start it with: bun run dev --port 8001
    echo.
    set /p START_SERVER="Start dev server now? (y/n) "
    if /i "!START_SERVER!"=="y" (
        echo Starting dev server...
        cd app
        start /B bun run dev --port 8001 > ..\dev-server.log 2>&1
        cd ..

        echo Waiting for server to be ready (8 seconds)...
        timeout /t 8 /nobreak

        powershell -Command "try { $null = Invoke-WebRequest http://localhost:8001 -TimeoutSec 2 -ErrorAction Stop; exit 0 } catch { exit 1 }"
        if %errorlevel% equ 0 (
            echo [OK] Dev server is ready
        ) else (
            echo [ERROR] Dev server failed to start
            echo Check dev-server.log for details
            exit /b 1
        )
    ) else (
        echo Dev server required to continue
        exit /b 1
    )
)

echo.
echo Creating screenshot directory...

if not exist "docs\Done\visual-validation-screenshots" (
    mkdir docs\Done\visual-validation-screenshots
)
echo [OK] Directory created

echo.
echo Running visual validation...
echo ---------------------------------------------------------------------------

REM Run the validation script
REM Try with bun first, fall back to npx
where bun >nul 2>nul
if %errorlevel% equ 0 (
    call bun run scripts/visual-validation-playwright.ts
) else (
    call npx ts-node scripts/visual-validation-playwright.ts
)

set VALIDATION_EXIT_CODE=%errorlevel%

echo ---------------------------------------------------------------------------

if %VALIDATION_EXIT_CODE% equ 0 (
    echo.
    echo [SUCCESS] Validation complete!
    echo.
    echo Next steps:
    echo 1. Review screenshots in: docs\Done\visual-validation-screenshots\
    echo 2. Open report: docs\Done\VISUAL_VALIDATION_REPORT.md
    echo 3. Score each page (1-5 per element)
    echo 4. Document any issues found
    echo 5. Calculate overall match percentages
    echo.

    set /p OPEN_REPORT="Open validation report? (y/n) "
    if /i "!OPEN_REPORT!"=="y" (
        start "" "docs\Done\VISUAL_VALIDATION_REPORT.md"
    )
) else (
    echo.
    echo [ERROR] Validation failed
    echo Check the error messages above for details
    exit /b 1
)

echo.
echo Done!
pause
