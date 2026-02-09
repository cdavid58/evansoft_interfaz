from django.urls import path
from .views import *

urlpatterns = [
    path('Create_Novelty/', Create_Novelty, name="Create_Novelty"),
]
