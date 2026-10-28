@echo off
rem eottae local Grok worker - keeps tools/grok_review_worker.mjs running (restarts it when it exits).
rem   exit 3 (Grok login/usage problem): retry after 1 hour, 4 (lock/clone state): 10 minutes, others: 30 seconds.
rem   log: C:\eottae-grok-review\worker.log
rem Run from a dedicated clone on main (see tools/grok_review_worker.mjs header).
rem Safety: cmd and node look up commands in the current directory before PATH. The clone receives
rem teammates' merged files, so never run from inside it: work in C:\eottae-grok-review, disable
rem current-directory lookup, and call node/timeout by absolute path.
setlocal
set NoDefaultCurrentDirectoryInExePath=1
set WORKER=%~dp0grok_review_worker.mjs
set NODE=%ProgramFiles%\nodejs\node.exe
set WAIT=%SystemRoot%\System32\timeout.exe
if not exist "C:\eottae-grok-review" mkdir "C:\eottae-grok-review"
cd /d "C:\eottae-grok-review"
:loop
echo [%date% %time%] start>> "C:\eottae-grok-review\worker.log"
"%NODE%" "%WORKER%" >> "C:\eottae-grok-review\worker.log" 2>&1
set CODE=%ERRORLEVEL%
echo [%date% %time%] exit %CODE%>> "C:\eottae-grok-review\worker.log"
if "%CODE%"=="3" ("%WAIT%" /t 3600 /nobreak >nul) else if "%CODE%"=="4" ("%WAIT%" /t 600 /nobreak >nul) else ("%WAIT%" /t 30 /nobreak >nul)
goto loop
