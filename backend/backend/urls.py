from django.contrib import admin
from django.urls import path, include
from dashboard.views import home_view, login_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('dashboard.urls')),
    path('api/', include('accounts.urls')),
    path('', home_view, name='home'),
    path('login/', login_view, name='login'),
]
