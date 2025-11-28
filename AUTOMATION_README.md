# Автоматизация сбора новостей

Есть несколько способов автоматизировать сбор новостей:

## Вариант 1: Django-APScheduler (Рекомендуется)

### Установка:
```bash
pip install django-apscheduler apscheduler
```

### Настройка:

1. Добавьте в `settings.py`:
```python
INSTALLED_APPS = [
    # ... другие приложения
    'django_apscheduler',
    'benefits_news',
]

# Настройки для APScheduler
APSCHEDULER_DATETIME_FORMAT = "N j, Y, f:s a"
APSCHEDULER_RUN_NOW = True
```

2. Примените миграции:
```bash
python manage.py migrate
```

3. Запустите планировщик в отдельном процессе:
```bash
python manage.py run_scheduler
```

Или добавьте в `benefits_news/apps.py` раскомментировав строку:
```python
start_scheduler()
```

### Расписание:
- Каждый день в 9:00 утра
- Каждые 6 часов

Можно изменить в `benefits_news/scheduler.py`

---

## Вариант 2: Windows Task Scheduler

### Автоматическая установка:
1. Запустите `setup_windows_task.bat` от имени администратора
2. Задача будет создана автоматически

### Ручная установка:

1. Откройте "Планировщик заданий Windows"
2. Создайте новую задачу:
   - **Имя**: LgotyNewsFetcher
   - **Триггер**: По расписанию, каждые 6 часов
   - **Действие**: Запустить программу
   - **Программа**: `python`
   - **Аргументы**: `C:\vitya9\lgoty-backend\backend\manage.py fetch_news --limit 10`
   - **Рабочая папка**: `C:\vitya9\lgoty-backend\backend`

### Команды для управления:
```bash
# Просмотр задачи
schtasks /Query /TN "LgotyNewsFetcher"

# Удаление задачи
schtasks /Delete /TN "LgotyNewsFetcher" /F

# Запуск задачи вручную
schtasks /Run /TN "LgotyNewsFetcher"
```

---

## Вариант 3: Celery (Для продакшена)

### Установка:
```bash
pip install celery redis
```

### Настройка:
1. Установите Redis
2. Создайте `backend/celery.py`
3. Добавьте задачи в `benefits_news/tasks.py`
4. Запустите worker: `celery -A backend worker -l info`
5. Запустите beat: `celery -A backend beat -l info`

---

## Вариант 4: Простой скрипт с циклом

Создайте файл `run_news_fetcher.py`:

```python
import time
import subprocess
import sys

while True:
    try:
        subprocess.run([sys.executable, 'manage.py', 'fetch_news', '--limit', '10'])
        # Ждем 6 часов (21600 секунд)
        time.sleep(21600)
    except KeyboardInterrupt:
        break
```

Запуск:
```bash
python run_news_fetcher.py
```

---

## Рекомендации:

- **Для разработки**: Вариант 1 (Django-APScheduler)
- **Для Windows сервера**: Вариант 2 (Task Scheduler)
- **Для Linux сервера**: Cron job
- **Для продакшена**: Вариант 3 (Celery)

## Проверка работы:

После настройки автоматизации проверьте логи или выполните:
```bash
python manage.py fetch_news --limit 5
```

