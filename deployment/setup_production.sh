#!/bin/bash
# Скрипт для автоматической настройки на продакшн-сервере

set -e

echo "=========================================="
echo "Настройка автоматического сбора новостей"
echo "=========================================="
echo

# Получаем пути
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../.." && pwd )"
VENV_PATH="${VIRTUAL_ENV:-$PROJECT_DIR/venv}"
PYTHON_PATH="$VENV_PATH/bin/python"

# Проверяем наличие Python
if [ ! -f "$PYTHON_PATH" ]; then
    echo "ОШИБКА: Python не найден в $PYTHON_PATH"
    echo "Укажите путь к виртуальному окружению:"
    read -p "Путь к venv: " VENV_PATH
    PYTHON_PATH="$VENV_PATH/bin/python"
fi

echo "Проект: $PROJECT_DIR"
echo "Python: $PYTHON_PATH"
echo

# Создаем директорию для логов
echo "Создание директории для логов..."
sudo mkdir -p /var/log/lgoty
sudo chown www-data:www-data /var/log/lgoty 2>/dev/null || sudo chown $USER:$USER /var/log/lgoty
echo "✓ Готово"
echo

# Выбор варианта
echo "Выберите вариант автоматизации:"
echo "1. Cron (простой, рекомендуется)"
echo "2. Systemd (с автоперезапуском)"
echo "3. Supervisor (для сложных сценариев)"
echo "4. Отмена"
echo
read -p "Ваш выбор (1-4): " choice

case $choice in
    1)
        echo
        echo "Настройка Cron..."
        CRON_LINE="0 */6 * * * cd $PROJECT_DIR && $PYTHON_PATH manage.py fetch_news --limit 10 >> /var/log/lgoty/news-fetcher.log 2>&1"
        echo "$CRON_LINE" | sudo tee /etc/cron.d/lgoty-news > /dev/null
        sudo chmod 644 /etc/cron.d/lgoty-news
        echo "✓ Cron задача создана"
        echo "Задача будет запускаться каждые 6 часов"
        ;;
    2)
        echo
        echo "Настройка Systemd..."
        sudo cp "$SCRIPT_DIR/systemd/lgoty-news-fetcher.service" /etc/systemd/system/
        sudo cp "$SCRIPT_DIR/systemd/lgoty-news-fetcher.timer" /etc/systemd/system/
        sudo sed -i "s|/path/to/lgoty-backend/backend|$PROJECT_DIR|g" /etc/systemd/system/lgoty-news-fetcher.service
        sudo sed -i "s|/path/to/venv/bin/python|$PYTHON_PATH|g" /etc/systemd/system/lgoty-news-fetcher.service
        sudo systemctl daemon-reload
        sudo systemctl enable lgoty-news-fetcher.timer
        sudo systemctl start lgoty-news-fetcher.timer
        echo "✓ Systemd timer создан и запущен"
        echo "Проверка: sudo systemctl status lgoty-news-fetcher.timer"
        echo "Логи: sudo journalctl -u lgoty-news-fetcher.service -f"
        ;;
    3)
        echo
        echo "Настройка Supervisor..."
        if ! command -v supervisorctl &> /dev/null; then
            echo "Supervisor не установлен. Установите: sudo apt-get install supervisor"
            exit 1
        fi
        sudo cp "$SCRIPT_DIR/supervisor/lgoty-news-fetcher.conf" /etc/supervisor/conf.d/
        sudo sed -i "s|/path/to/lgoty-backend/backend|$PROJECT_DIR|g" /etc/supervisor/conf.d/lgoty-news-fetcher.conf
        sudo sed -i "s|/path/to/venv/bin/python|$PYTHON_PATH|g" /etc/supervisor/conf.d/lgoty-news-fetcher.conf
        sudo supervisorctl reread
        sudo supervisorctl update
        sudo supervisorctl start lgoty-news-fetcher
        echo "✓ Supervisor конфигурация создана"
        echo "Проверка: sudo supervisorctl status lgoty-news-fetcher"
        ;;
    4)
        echo "Отменено"
        exit 0
        ;;
    *)
        echo "Неверный выбор"
        exit 1
        ;;
esac

echo
echo "=========================================="
echo "Настройка завершена!"
echo "=========================================="
echo
echo "Проверка работы:"
echo "  $PYTHON_PATH $PROJECT_DIR/manage.py fetch_news --limit 5"
echo

