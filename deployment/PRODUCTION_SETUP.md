# Настройка автоматизации для продакшн-сервера

После размещения на сервере нужно настроить автоматический сбор новостей. Выберите один из вариантов ниже.

## 🚀 Вариант 1: Cron (Самый простой для Linux)

### Установка:

1. **Создайте директорию для логов:**
```bash
sudo mkdir -p /var/log/lgoty
sudo chown www-data:www-data /var/log/lgoty
```

2. **Отредактируйте файл cron:**
```bash
sudo nano /etc/cron.d/lgoty-news
```

3. **Добавьте строку (замените пути на реальные):**
```
0 */6 * * * www-data cd /path/to/lgoty-backend/backend && /path/to/venv/bin/python manage.py fetch_news --limit 10 >> /var/log/lgoty/news-fetcher.log 2>&1
```

4. **Или используйте готовый файл:**
```bash
sudo cp deployment/cron/lgoty-news-cron /etc/cron.d/lgoty-news
sudo nano /etc/cron.d/lgoty-news  # Отредактируйте пути
sudo chmod 644 /etc/cron.d/lgoty-news
```

5. **Проверьте cron:**
```bash
sudo crontab -l -u www-data
```

**Преимущества:**
- ✅ Простота настройки
- ✅ Работает после перезагрузки
- ✅ Не требует дополнительных сервисов

---

## ⚙️ Вариант 2: Systemd (Рекомендуется для Linux)

### Установка:

1. **Отредактируйте файл сервиса:**
```bash
sudo nano deployment/systemd/lgoty-news-fetcher.service
```

2. **Измените пути:**
- `/path/to/lgoty-backend/backend` → реальный путь к проекту
- `/path/to/venv/bin/python` → путь к Python из виртуального окружения
- `www-data` → пользователь, под которым работает Django

3. **Скопируйте файл:**
```bash
sudo cp deployment/systemd/lgoty-news-fetcher.service /etc/systemd/system/
```

4. **Перезагрузите systemd:**
```bash
sudo systemctl daemon-reload
```

5. **Скопируйте timer файл:**
```bash
sudo cp deployment/systemd/lgoty-news-fetcher.timer /etc/systemd/system/
```

6. **Включите и запустите timer:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable lgoty-news-fetcher.timer
sudo systemctl start lgoty-news-fetcher.timer
```

7. **Проверьте статус:**
```bash
sudo systemctl status lgoty-news-fetcher.timer
sudo systemctl list-timers lgoty-news-fetcher.timer
```

7. **Просмотр логов:**
```bash
sudo journalctl -u lgoty-news-fetcher.service -f
```

**Преимущества:**
- ✅ Автоматический перезапуск при сбоях
- ✅ Управление через systemctl
- ✅ Логирование в journald

---

## 🔧 Вариант 3: Supervisor (Для сложных сценариев)

### Установка:

1. **Установите Supervisor:**
```bash
sudo apt-get install supervisor  # Ubuntu/Debian
sudo yum install supervisor      # CentOS/RHEL
```

2. **Отредактируйте конфигурацию:**
```bash
sudo nano deployment/supervisor/lgoty-news-fetcher.conf
```

3. **Измените пути** (как в systemd)

4. **Скопируйте конфигурацию:**
```bash
sudo cp deployment/supervisor/lgoty-news-fetcher.conf /etc/supervisor/conf.d/
```

5. **Перезагрузите Supervisor:**
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start lgoty-news-fetcher
```

6. **Проверьте статус:**
```bash
sudo supervisorctl status
```

**Преимущества:**
- ✅ Удобное управление несколькими процессами
- ✅ Веб-интерфейс для мониторинга
- ✅ Автоматический перезапуск

---

## 🎯 Вариант 4: Celery + Redis (Для масштабирования)

### Установка:

1. **Установите Redis:**
```bash
sudo apt-get install redis-server  # Ubuntu/Debian
sudo systemctl start redis
sudo systemctl enable redis
```

2. **Установите Celery:**
```bash
pip install celery redis
```

3. **Добавьте в `settings.py`:**
```python
CELERY_BROKER_URL = 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = 'redis://localhost:6379/0'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULE = {
    'fetch-news-every-6-hours': {
        'task': 'benefits_news.tasks.fetch_news_task',
        'schedule': 21600.0,  # 6 часов
    },
}
```

4. **Создайте `backend/celery.py`:**
```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
app = Celery('lgoty')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

5. **Добавьте в `backend/__init__.py`:**
```python
from .celery import app as celery_app
__all__ = ('celery_app',)
```

6. **Запустите Celery worker:**
```bash
celery -A backend worker -l info
```

7. **Запустите Celery beat (планировщик):**
```bash
celery -A backend beat -l info
```

8. **Или используйте systemd для Celery:**
```bash
# Создайте сервисы для worker и beat
sudo cp deployment/systemd/celery-worker.service /etc/systemd/system/
sudo cp deployment/systemd/celery-beat.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable celery-worker celery-beat
sudo systemctl start celery-worker celery-beat
```

**Преимущества:**
- ✅ Масштабируемость
- ✅ Распределенная обработка задач
- ✅ Мониторинг через Flower

---

## 📋 Рекомендации по выбору

| Вариант | Сложность | Для продакшна | Масштабируемость |
|---------|-----------|---------------|------------------|
| Cron | ⭐ Простой | ✅ Да | ⭐ Базовая |
| Systemd | ⭐⭐ Средний | ✅✅ Да | ⭐⭐ Средняя |
| Supervisor | ⭐⭐ Средний | ✅✅ Да | ⭐⭐⭐ Хорошая |
| Celery | ⭐⭐⭐ Сложный | ✅✅✅ Да | ⭐⭐⭐⭐ Отличная |

**Для большинства проектов:** Используйте **Cron** или **Systemd**

**Для больших проектов:** Используйте **Celery**

---

## 🔍 Проверка работы

После настройки проверьте:

```bash
# Проверка cron
sudo tail -f /var/log/lgoty/news-fetcher.log

# Проверка systemd
sudo systemctl status lgoty-news-fetcher.service
sudo journalctl -u lgoty-news-fetcher.service -f

# Проверка supervisor
sudo supervisorctl status lgoty-news-fetcher

# Проверка Celery
celery -A backend inspect active
```

---

## 🛠️ Обновление путей

Не забудьте заменить в конфигурационных файлах:
- `/path/to/lgoty-backend/backend` → реальный путь
- `/path/to/venv/bin/python` → путь к Python
- `www-data` → пользователь вашего сервера

---

## 📝 Логирование

Все варианты записывают логи:
- Cron: `/var/log/lgoty/news-fetcher.log`
- Systemd: `journalctl -u lgoty-news-fetcher`
- Supervisor: `/var/log/lgoty/news-fetcher.out.log`
- Celery: настраивается отдельно

