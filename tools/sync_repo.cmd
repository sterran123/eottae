@echo off
rem Task Scheduler wrapper - appends sync result to .repo-sync.log (gitignored)
echo [%date% %time%] >> "%~dp0..\.repo-sync.log"
node "%~dp0sync_repo.mjs" >> "%~dp0..\.repo-sync.log" 2>&1
