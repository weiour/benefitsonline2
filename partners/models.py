from django.db import models

class Partner(models.Model):
    name = models.CharField(max_length=255)
    logo_url = models.URLField(blank=True)
    website = models.URLField(blank=True)
    description = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    address = models.CharField(max_length=500, blank=True, verbose_name='Адрес')
    active = models.BooleanField(default=True)  # добавляем

    def __str__(self):
        return self.name



class PartnerOffer(models.Model):
    partner = models.ForeignKey(Partner, on_delete=models.CASCADE, related_name='offers')

    title = models.CharField(max_length=255)
    description = models.TextField()

    discount = models.JSONField(default=dict)

    target_groups = models.JSONField(default=list)
    regions = models.JSONField(default=list)

    valid_until = models.DateField(null=True, blank=True)

    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.partner.name}: {self.title}"
