from django.contrib import admin

from .models import ChatMessage, Expense


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'timestamp', 'has_file')
    list_select_related = ('user',)
    search_fields = ('user__username', 'user__first_name', 'user__last_name', 'message')
    readonly_fields = ('timestamp',)

    @staticmethod
    def has_file(obj):
        return bool(obj.file)


@admin.register(Expense)
class ExpenseAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'amount', 'expense_date', 'created_by')
    list_filter = ('category', 'expense_date')
    search_fields = ('title', 'notes', 'created_by__username', 'created_by__first_name', 'created_by__last_name')
