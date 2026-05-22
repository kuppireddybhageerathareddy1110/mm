@echo off
title Sentiment Studio - Launcher
echo ======================================================================
echo             Starting Sentiment Studio Setup ^& Run (Windows)
echo ======================================================================
echo.

REM ------------------ Backend Setup ------------------
echo [1/4] Setting up Python virtual environment...
if not exist venv (
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Please check if Python is installed and added to PATH.
        pause
        exit /b 1
    )
    echo Virtual environment created successfully.
) else (
    echo Virtual environment already exists.
)

echo.
echo [2/4] Installing backend dependencies...
call venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install backend dependencies.
    pause
    exit /b 1
)
echo Backend dependencies installed successfully.

echo.
echo [3/4] Launching backend FastAPI server...
start "Sentiment Studio Backend" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000"

REM ------------------ Frontend Setup ------------------
echo.
echo [4/4] Setting up frontend...
cd frontend
if not exist node_modules (
    echo Installing npm dependencies - this may take a minute...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo [ERROR] Failed to install frontend dependencies. Please check if Node.js is installed.
        pause
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed.
)

echo Launching Next.js frontend...
start "Sentiment Studio Frontend" cmd /k "npm run dev -- --hostname 127.0.0.1 --port 3001"

cd ..
echo.
echo ======================================================================
echo                  SUCCESSFULLY LAUNCHED BOTH SERVERS!
echo ======================================================================
echo.
echo - Backend: http://127.0.0.1:8000
echo - Frontend: http://127.0.0.1:3001
echo.
echo Press any key to exit this launcher (the spawned server windows will remain open).
pause
