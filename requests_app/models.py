from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from users.models import User
from benefits.models import Benefit

class BenefitRequest(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    benefit = models.ForeignKey(Benefit, on_delete=models.CASCADE)

    status = models.CharField(
        max_length=20,
        choices=[
            ('new', 'Отправлена'),
            ('processing', 'В обработке'),
            ('approved', 'Одобрена'),
            ('rejected', 'Отклонена'),
        ],
        default='new'
    )

    submitted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    comment = models.TextField(blank=True)

    def __str__(self):
        return f"{self.user} → {self.benefit} ({self.status})"

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'benefit'],
                name='unique_user_benefit_request'
            )
        ]
        ordering = ['-submitted_at']


def _get_max_benefits_limit(user):
    """Получение максимального лимита льгот в зависимости от категории пользователя"""
    base_limit = 5
    
    if user.category == 'disabled':
        return 7
    elif user.category == 'veteran':
        return 6
    elif user.category == 'family':
        return 8
    
    return base_limit


@receiver(pre_save, sender=BenefitRequest)
def create_notification_on_status_change(sender, instance, **kwargs):
    """Создает уведомление при изменении статуса заявки и проверяет лимит при одобрении"""
    if instance.pk:  # Объект уже существует в БД
        try:
            old_instance = BenefitRequest.objects.get(pk=instance.pk)
            old_status = old_instance.status
            new_status = instance.status
            
            # Если статус изменился на 'approved', проверяем лимит
            if old_status != 'approved' and new_status == 'approved':
                # Подсчитываем количество уже одобренных заявок (исключая текущую)
                approved_count = BenefitRequest.objects.filter(
                    user=instance.user, 
                    status='approved'
                ).exclude(pk=instance.pk).count()
                
                max_limit = _get_max_benefits_limit(instance.user)
                
                if approved_count >= max_limit:
                    # Не позволяем одобрить заявку, если лимит уже достигнут
                    raise ValueError(
                        f'Невозможно одобрить заявку: пользователь уже имеет максимальное количество '
                        f'одобренных льгот ({max_limit}).'
                    )
            
            # Если статус изменился и это не первый раз (статус не был 'new')
            if old_status != new_status:
                from notifications.models import Notification
                
                # Определяем текст уведомления в зависимости от нового статуса
                status_messages = {
                    'processing': {
                        'title': 'Заявка в обработке',
                        'message': f'Ваша заявка на льготу "{instance.benefit.title}" находится в обработке.'
                    },
                    'approved': {
                        'title': 'Заявка одобрена! 🎉',
                        'message': f'Ваша заявка на льготу "{instance.benefit.title}" была одобрена. Поздравляем!'
                    },
                    'rejected': {
                        'title': 'Заявка отклонена',
                        'message': f'Ваша заявка на льготу "{instance.benefit.title}" была отклонена.'
                    }
                }
                
                # Создаем уведомление только для определенных статусов
                if new_status in status_messages:
                    message_data = status_messages[new_status]
                    
                    # Если есть комментарий, добавляем его к сообщению
                    message = message_data['message']
                    if instance.comment:
                        message += f'\n\nКомментарий: {instance.comment}'
                    
                    Notification.objects.create(
                        user=instance.user,
                        title=message_data['title'],
                        message=message
                    )
        except BenefitRequest.DoesNotExist:
            # Объект создается впервые, уведомление не нужно
            pass