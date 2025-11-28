#!/bin/bash
# Скрипт для настройки cron job на Linux/Mac
# Запускает сбор новостей каждые 6 часов

# Получаем абсолютный путь к manage.py
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$( cd "$SCRIPT_DIR/../../.." && pwd )"
MANAGE_PY="$PROJECT_DIR/manage.py"
PYTHON_PATH=$(which python3)

# Создаем cron job (каждые 6 часов)
CRON_JOB="0 */6 * * * cd $PROJECT_DIR && $PYTHON_PATH $MANAGE_PY fetch_news --limit 10 >> /var/log/lgoty_news.log 2>&1"

# Добавляем в crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "Cron job успешно создан!"
echo "Задача будет запускаться каждые 6 часов"
echo ""
echo "Для просмотра cron jobs: crontab -l"
echo "Для удаления: crontab -e (удалите соответствующую строку)"

