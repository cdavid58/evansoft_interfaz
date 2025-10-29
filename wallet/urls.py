from django.urls import path
from .views import *

urlpatterns = [
    path('Create_Pass_Invoice/', Create_Pass_Invoice, name="Create_Pass_Invoice"),
]