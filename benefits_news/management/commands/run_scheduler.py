"""
Команда для запуска планировщика задач в отдельном процессе
Использование: python manage.py run_scheduler
"""
from django.core.management.base import BaseCommand
from benefits_news.scheduler import start_scheduler
import time
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Запускает планировщик задач для автоматического сбора новостей'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Запуск планировщика задач...'))
        self.stdout.write('Планировщик будет собирать новости автоматически')
        self.stdout.write('Нажмите Ctrl+C для остановки')
        
        try:
            start_scheduler()
            # Держим процесс запущенным
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            self.stdout.write(self.style.SUCCESS('\nПланировщик остановлен'))

