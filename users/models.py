from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    full_name = models.CharField(max_length=255)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    category = models.CharField(
        max_length=50,
        choices=[
            ('pensioner', 'Пенсионер'),
            ('disabled', 'Инвалид'),
            ('low_income', 'Малоимущий'),
            ('family', 'Многодетная семья'),
            ('veteran', 'Ветеран'),
            ('student', 'Студент'),
        ],
        blank=True
    )

    region = models.CharField(max_length=10, default='all')

    snils = models.CharField(max_length=14, blank=True, null=True)

    phone_verified = models.BooleanField(default=False)
    email_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.full_name or self.username
