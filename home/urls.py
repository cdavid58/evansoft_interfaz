from django.urls import path
from .views import *

urlpatterns = [
    path('', Logins, name="Logins"),
    path('Index/', Index, name="Index"),
    path('service_worker_cache/', service_worker_cache, name='service_worker_cache'),
    path('Pricing/', Pricing, name='Pricing'),
    path('Evangeli/', Evangeli, name='Evangeli'),
    path('OutLogin/', OutLogin, name='OutLogin'),
    path('Create_Company/', Create_Company, name='Create_Company'),
    path('Logins_account_free/<str:nit>/<str:user>/<str:psswd>/', Logins_account_free, name='Logins_account_free'),
]
