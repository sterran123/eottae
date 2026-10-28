@echo off
rem eottae local Grok worker - keeps tools/grok_review_worker.mjs running (restarts it when it exits).
rem   exit 3 (Grok login/usage problem): retry after 1 hour, 4 (lock/clone state): 10 minutes, others: 30 seconds.
rem   log: C:\eottae-grok-review\worker.log
rem Run from a dedicated clone on main (see tools/grok_review_worker.mjs header).
setlocal
cd /d "%~dp0.."
if not exist "C:\eottae-grok-review" mkdir "C:\eottae-grok-review"
:loop
echo [%date% %time%] start>> "C:\eottae-grok-review\worker.log"
node tools\grok_review_worker.mjs >> "C:\eottae-grok-review\worker.log" 2>&1
set CODE=%ERRORLEVEL%
echo [%date% %time%] exit %CODE%>> "C:\eottae-grok-review\worker.log"
if "%CODE%"=="3" (timeout /t 3600 /nobreak >nul) else if "%CODE%"=="4" (timeout /t 600 /nobreak >nul) else (timeout /t 30 /nobreak >nul)
goto loop
