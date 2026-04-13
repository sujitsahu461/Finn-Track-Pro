@echo off
set PATH=%PATH%;"C:\Program Files\nodejs\"
echo Starting FinTrackPro Backend...
start cmd /k "set PATH=%PATH%;C:\Program Files\nodejs\& cd backend && npm run dev"
echo Starting FinTrackPro Frontend...
start cmd /k "set PATH=%PATH%;C:\Program Files\nodejs\& cd frontend && npm run dev"
echo Servers started in separate windows!
