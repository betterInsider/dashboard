from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import CustomUser, Notification


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = (
        'username',
        'id',
        'first_name',
        'last_name',
        'role',
        'is_staff',
        'is_superuser',
        'is_active',
    )
    list_filter = ('role', 'is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'first_name', 'last_name', 'id', 'email')
    ordering = ('username',)
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('id', 'first_name', 'last_name', 'email', 'avatar', 'skills')}),
        ('Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Internal', {'fields': ('internal_password',)}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('id', 'username', 'first_name', 'last_name', 'email', 'role', 'skills', 'password1', 'password2', 'is_staff', 'is_superuser', 'is_active'),
        }),
    )


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'user_id', 'time', 'read')
    list_filter = ('type', 'read')
    search_fields = ('id', 'message', 'user_id')
