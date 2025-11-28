from django.contrib import admin
from .models import NewsArticle


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ['title', 'source_name', 'category', 'published_date', 'active']
    list_filter = ['active', 'category', 'published_date']
    search_fields = ['title', 'excerpt', 'content']
    readonly_fields = ['created_at', 'updated_at']
