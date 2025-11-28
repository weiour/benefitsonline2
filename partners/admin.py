from django.contrib import admin
from .models import Partner, PartnerOffer

@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'website')  # показываем реальные поля
    search_fields = ('name', 'website')        # можно искать по этим полям

@admin.register(PartnerOffer)
class PartnerOfferAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'partner_name', 'valid_until', 'active')  # добавляем поле active из модели
    list_filter = ('active',)  # фильтр по реальному полю модели
    search_fields = ('title', 'partner__name')  # можно искать по названию предложения и партнера

    def partner_name(self, obj):
        return obj.partner.name
    partner_name.short_description = 'Partner'