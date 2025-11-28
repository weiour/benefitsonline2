from django.contrib import admin
from .models import Benefit, BenefitCategory

@admin.register(BenefitCategory)
class BenefitCategoryAdmin(admin.ModelAdmin):
    list_display = ('title', 'key')
    search_fields = ('title', 'key')

@admin.register(Benefit)
class BenefitAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'category', 'is_sponsored', 'active', 'created_at')
    list_filter = ('type', 'category', 'is_sponsored', 'active')
    search_fields = ('title', 'description', 'how_to_get')
from .models import TargetGroup

@admin.register(TargetGroup)
class TargetGroupAdmin(admin.ModelAdmin):
    list_display = ('key', 'title')
    search_fields = ('key', 'title')
