"""
Celery задачи для автоматического сбора новостей
"""
from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


@shared_task(name='benefits_news.tasks.fetch_news_task')
def fetch_news_task():
    """
    Celery задача для автоматического сбора новостей
    """
    try:
        logger.info('Начинаю автоматический сбор новостей (Celery)...')
        call_command('fetch_news', '--limit', '10', verbosity=0)
        logger.info('Автоматический сбор новостей завершен успешно')
        return 'Success'
    except Exception as e:
        logger.error(f'Ошибка при автоматическом сборе новостей: {e}')
        raise

