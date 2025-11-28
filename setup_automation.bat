@echo off
chcp 65001 >nul
echo ========================================
echo Настройка автоматического сбора новостей
echo ========================================
echo.

REM Получаем текущую директорию
set "CURRENT_DIR=%~dp0"
set "PROJECT_DIR=%CURRENT_DIR%"
set "MANAGE_PY=%PROJECT_DIR%manage.py"

echo Текущая директория: %PROJECT_DIR%
echo.

REM Проверяем наличие manage.py
if not exist "%MANAGE_PY%" (
    echo ОШИБКА: Файл manage.py не найден!
    echo Убедитесь, что вы запускаете скрипт из директории backend
    pause
    exit /b 1
)

echo Выберите вариант автоматизации:
echo.
echo 1. Windows Task Scheduler (каждые 6 часов) - РЕКОМЕНДУЕТСЯ
echo 2. Python скрипт с циклом (запускать вручную)
echo 3. Отмена
echo.
set /p choice="Ваш выбор (1-3): "

if "%choice%"=="1" goto task_scheduler
if "%choice%"=="2" goto python_script
if "%choice%"=="3" goto end
goto invalid_choice

:task_scheduler
echo.
echo Создание задачи в Windows Task Scheduler...
echo.

REM Получаем путь к Python
where python >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ОШИБКА: Python не найден в PATH!
    echo Убедитесь, что Python установлен и добавлен в PATH
    pause
    exit /b 1
)

for /f "delims=" %%i in ('where python') do set PYTHON_PATH=%%i
echo Найден Python: %PYTHON_PATH%
echo.

REM Создаем задачу
schtasks /Create /TN "LgotyNewsFetcher" /TR "\"%PYTHON_PATH%\" \"%MANAGE_PY%\" fetch_news --limit 10" /SC HOURLY /MO 6 /F /RU SYSTEM

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Задача успешно создана!
    echo.
    echo Задача будет запускаться каждые 6 часов
    echo Имя задачи: LgotyNewsFetcher
    echo.
    echo Полезные команды:
    echo   - Просмотр задачи: schtasks /Query /TN "LgotyNewsFetcher"
    echo   - Запуск вручную: schtasks /Run /TN "LgotyNewsFetcher"
    echo   - Удаление задачи: schtasks /Delete /TN "LgotyNewsFetcher" /F
    echo.
    echo Хотите запустить задачу сейчас для проверки? (Y/N)
    set /p test_run="> "
    if /i "%test_run%"=="Y" (
        echo Запуск задачи...
        schtasks /Run /TN "LgotyNewsFetcher"
        echo Задача запущена!
    )
) else (
    echo.
    echo ✗ Ошибка при создании задачи
    echo Возможно, нужны права администратора
    echo Попробуйте запустить этот скрипт от имени администратора
)
goto end

:python_script
echo.
echo Создание Python скрипта для автоматического сбора...
echo.
echo Скрипт run_news_fetcher.py уже создан!
echo.
echo Для запуска выполните:
echo   python run_news_fetcher.py
echo.
echo Скрипт будет собирать новости каждые 6 часов
echo Нажмите Ctrl+C для остановки
echo.
goto end

:invalid_choice
echo Неверный выбор!
goto end

:end
echo.
echo Готово!
pause

