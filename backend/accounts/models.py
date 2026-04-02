from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    id = models.CharField(max_length=50, primary_key=True)
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('employee', 'Employee'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='employee')
    avatar = models.TextField(null=True, blank=True)  # TextField to support base64 image data
    skills = models.JSONField(default=list, blank=True)
    internal_password = models.CharField(max_length=255, null=True, blank=True)

    def __str__(self):
        return self.username

class Notification(models.Model):
    id = models.CharField(max_length=50, primary_key=True)
    type = models.CharField(max_length=50)
    message = models.CharField(max_length=500)
    time = models.CharField(max_length=50)
    read = models.BooleanField(default=False)
    user_id = models.CharField(max_length=50) # Link by user id string

    def __str__(self):
        return self.message
