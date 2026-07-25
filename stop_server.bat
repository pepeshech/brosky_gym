@echo off
title Stop Brosky Gym Server
echo Остановка локального сервера Brosky Gym на порту 4173...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr /R /C:":4173 .*LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
    echo Процесс PID %%a успешно завершен.
)

echo Сервер остановлен.
timeout /t 2 >nul
