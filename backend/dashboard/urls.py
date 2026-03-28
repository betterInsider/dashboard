from django.urls import path
from . import views

urlpatterns = [
    path('db', views.api_db, name='api_db'),
]
