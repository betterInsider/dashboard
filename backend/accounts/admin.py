from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserAdminChangeForm, CustomUserAdminCreationForm
from .models import CustomUser, Notification


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    model = CustomUser
    form = CustomUserAdminChangeForm
    add_form = CustomUserAdminCreationForm
    add_form_template = 'admin/accounts/customuser/add_form.html'
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
    filter_horizontal = ('groups', 'user_permissions')
    fieldsets = (
        ('Login & Identity', {
            'description': 'Manage how this user appears and logs into the Better Inside dashboard.',
            'fields': ('id', 'username', 'email', 'password'),
        }),
        ('Profile', {
            'description': 'These details are shown across the dashboard and team views.',
            'fields': ('first_name', 'last_name', 'avatar', 'skills'),
        }),
        ('Permissions', {
            'description': 'Control dashboard role and admin access in one place.',
            'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
        ('Internal', {'fields': ('internal_password',)}),
    )
    add_fieldsets = (
        ('Basic details', {
            'classes': ('wide',),
            'description': 'Start with the employee identity details used in the dashboard.',
            'fields': ('id', 'first_name', 'last_name', 'username', 'email', 'role', 'skills'),
        }),
        ('Login setup', {
            'classes': ('wide',),
            'description': 'Create login access for this user.',
            'fields': ('password1', 'password2'),
        }),
        ('Access switches', {
            'classes': ('wide',),
            'description': 'Keep this simple: staff = can access /admin, superuser = full control.',
            'fields': ('is_active', 'is_staff', 'is_superuser'),
        }),
    )

    class Media:
        css = {
            'all': ('admin/css/custom_user_admin.css',)
        }


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'type', 'user_id', 'time', 'read')
    list_filter = ('type', 'read')
    search_fields = ('id', 'message', 'user_id')


admin.site.site_header = 'Better Inside Admin'
admin.site.site_title = 'Better Inside Admin'
admin.site.index_title = 'Operations & User Management'
