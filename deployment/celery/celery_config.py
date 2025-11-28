"""
Конфигурация Celery для автоматического сбора новостей
Требует установки Redis или RabbitMQ
"""
from celery import Celery
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('lgoty')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Настройки для периодических задач
app.conf.beat_schedule = {
    'fetch-news-every-6-hours': {
        'task': 'benefits_news.tasks.fetch_news_task',
        'schedule': 21600.0,  # 6 часов в секундах
    },
    'fetch-news-daily': {
        'task': 'benefits_news.tasks.fetch_news_task',
        'schedule': 86400.0,  # 24 часа (каждый день в 9:00)
    },
}

app.conf.timezone = 'UTC'

