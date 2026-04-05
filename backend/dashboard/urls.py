from django.urls import path
from . import views

urlpatterns = [
    path('db', views.api_db, name='api_db'),
    path('chat/messages', views.api_chat_messages, name='api_chat_messages'),
    path('chat/messages/<int:message_id>', views.api_chat_message_detail, name='api_chat_message_detail'),
]
