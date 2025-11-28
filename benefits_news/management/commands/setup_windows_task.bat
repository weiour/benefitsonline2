@echo off
REM Скрипт для создания задачи в Windows Task Scheduler
REM Автоматический запуск сбора новостей каждые 6 часов

echo Создание задачи в планировщике Windows...

REM Получаем путь к Python и manage.py
set PYTHON_PATH=python
set PROJECT_PATH=%~dp0..\..\..\..
set MANAGE_PY=%PROJECT_PATH%\manage.py

REM Создаем задачу, которая будет запускаться каждые 6 часов
schtasks /Create /TN "LgotyNewsFetcher" /TR "%PYTHON_PATH% %MANAGE_PY% fetch_news --limit 10" /SC HOURLY /MO 6 /F

if %ERRORLEVEL% EQU 0 (
    echo Задача успешно создана!
    echo Задача будет запускаться каждые 6 часов
    echo Для просмотра задач: schtasks /Query /TN "LgotyNewsFetcher"
    echo Для удаления задачи: schtasks /Delete /TN "LgotyNewsFetcher" /F
) else (
    echo Ошибка при создании задачи. Возможно, нужны права администратора.
)

pause

