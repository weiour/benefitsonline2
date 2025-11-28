from django.contrib import admin
from .models import BenefitRequest

@admin.register(BenefitRequest)
class BenefitRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'benefit', 'status', 'submitted_at', 'updated_at')
    
    list_filter = ('status', 'submitted_at', 'updated_at')
    
    search_fields = ('user__username', 'user__full_name', 'benefit__title', 'comment')
    
    ordering = ('-submitted_at',)
