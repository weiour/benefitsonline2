from django.apps import AppConfig


class BenefitsNewsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'benefits_news'
    
    def ready(self):
        """
        Запускается при инициализации приложения
        Здесь можно запустить планировщик задач
        """
        # Импортируем здесь, чтобы избежать циклических импортов
        try:
            from .scheduler import start_scheduler
            # Раскомментируйте следующую строку для автоматического запуска планировщика
            # start_scheduler()
        except ImportError:
            # Если django-apscheduler не установлен, просто пропускаем
            pass