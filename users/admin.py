from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'full_name', 'category', 'region', 'is_staff', 'is_active', 'created_at')
    list_filter = ('category', 'region', 'is_staff', 'is_active', 'created_at')
    search_fields = ('username', 'full_name', 'email', 'phone_verified')
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Личная информация', {'fields': ('full_name', 'email', 'category', 'region')}),
        ('Права доступа', {'fields': ('is_staff', 'is_active', 'is_superuser', 'groups', 'user_permissions')}),
        ('Дополнительно', {'fields': ('phone_verified', 'email_verified', 'last_login')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'full_name', 'email', 'category', 'region', 'password1', 'password2', 'is_staff', 'is_active')}
        ),
    )
    
    ordering = ('username',)
    filter_horizontal = ('groups', 'user_permissions',)
