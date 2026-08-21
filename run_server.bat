@echo off
title Brosky Gym
cd /d "%~dp0app"

set "BRAVE_EXE=C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"

:: Проверка: запущен ли уже сервер на порту 4173?
netstat -o -n -a | findstr /R /C:":4173 .*LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    if exist "%BRAVE_EXE%" (
        start "" "%BRAVE_EXE%" "http://localhost:4173/"
    ) else (
        start "" "http://localhost:4173/"
    )
    exit /b 0
)

:: Проверка наличия собранного проекта dist
if not exist "dist\index.html" (
    echo [Brosky Gym] Папка dist не найдена. Выполняется начальная сборка проекта...
    call npm run build
)

:: Открываем браузер через 1 сек и запускаем сервер Vite Preview
start /b cmd /c "timeout /t 1 /nobreak >nul & if exist "%BRAVE_EXE%" (start "" "%BRAVE_EXE%" "http://localhost:4173/") else (start "" "http://localhost:4173/")"

npm run preview
