from django.conf import settings
from django.db import models


class ChatMessage(models.Model):
    MESSAGE_TYPE_CHOICES = (
        ('text', 'Text'),
        ('meeting_invite', 'Meeting Invite'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_messages',
    )
    message_type = models.CharField(max_length=30, choices=MESSAGE_TYPE_CHOICES, default='text')
    message = models.TextField(blank=True)
    file = models.FileField(upload_to='chat_uploads/%Y/%m/', blank=True, null=True)
    original_file_name = models.CharField(max_length=255, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['timestamp', 'id']

    def __str__(self):
        preview = (self.message or self.file.name or 'Chat message').strip()
        return f'{self.user} - {preview[:50]}'


class Expense(models.Model):
    CATEGORY_CHOICES = (
        ('operations', 'Operations'),
        ('software', 'Software'),
        ('travel', 'Travel'),
        ('marketing', 'Marketing'),
        ('salary', 'Salary'),
        ('misc', 'Miscellaneous'),
    )

    id = models.CharField(max_length=50, primary_key=True)
    title = models.CharField(max_length=255)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='operations')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField()
    notes = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_expenses',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-expense_date', '-created_at']

    def __str__(self):
        return f'{self.title} ({self.amount})'
