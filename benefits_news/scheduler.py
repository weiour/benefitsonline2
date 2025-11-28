"""
Планировщик задач для автоматического сбора новостей
Использует APScheduler для периодического запуска задач
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore, register_events
from django_apscheduler.models import DjangoJobExecution
import logging
from .tasks import fetch_news_task

logger = logging.getLogger(__name__)


def start_scheduler():
    """
    Запускает планировщик задач
    """
    scheduler = BackgroundScheduler()
    scheduler.add_jobstore(DjangoJobStore(), "default")
    
    # Задача: собирать новости каждый день в 9:00 утра
    scheduler.add_job(
        fetch_news_task,
        trigger=CronTrigger(hour=9, minute=0),  # Каждый день в 9:00
        id="fetch_news_daily",
        name="Сбор новостей о льготах",
        replace_existing=True,
    )
    
    # Задача: собирать новости каждые 6 часов
    scheduler.add_job(
        fetch_news_task,
        trigger=CronTrigger(hour='*/6'),  # Каждые 6 часов
        id="fetch_news_hourly",
        name="Сбор новостей о льготах (каждые 6 часов)",
        replace_existing=True,
    )
    
    register_events(scheduler)
    
    try:
        logger.info("Запуск планировщика задач...")
        scheduler.start()
        logger.info("Планировщик задач запущен успешно")
    except Exception as e:
        logger.error(f"Ошибка при запуске планировщика: {e}")

