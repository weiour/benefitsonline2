"""
Задачи для автоматического сбора новостей
"""
from django.core.management import call_command
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)


def fetch_news_task():
    """
    Задача для автоматического сбора новостей
    Запускается по расписанию
    """
    try:
        logger.info('Начинаю автоматический сбор новостей...')
        call_command('fetch_news', '--limit', '10', verbosity=0)
        logger.info('Автоматический сбор новостей завершен успешно')
    except Exception as e:
        logger.error(f'Ошибка при автоматическом сборе новостей: {e}')

