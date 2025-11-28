from django.db import models
class TargetGroup(models.Model):
    key = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=200)

    def __str__(self):
        return self.title

class BenefitCategory(models.Model):
    key = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    icon = models.CharField(max_length=100, blank=True)

    def __str__(self):
        return self.title


class Benefit(models.Model):
    BENEFIT_TYPE = [
        ('federal', 'Федераральная'),
        ('regional', 'Региональная'),
        ('municipal', 'Муниципальная'),
        ('commercial', 'Коммерческая')
    ]

    id = models.CharField(primary_key=True, max_length=100)

    title = models.CharField(max_length=255)
    type = models.CharField(max_length=20, choices=BENEFIT_TYPE)

    category = models.ForeignKey(BenefitCategory, on_delete=models.CASCADE, related_name='benefits')

    target_groups = models.ManyToManyField(TargetGroup, related_name='benefits')
    regions = models.JSONField(default=list)

    description = models.TextField()
    how_to_get = models.TextField()

    is_sponsored = models.BooleanField(default=False, verbose_name='От спонсора')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
