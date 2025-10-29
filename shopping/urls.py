from django.urls import path
from .views import *

urlpatterns = [
    path('Create_Shopping/', Create_Shopping, name="Create_Shopping"),
    # path('Get_List_Supplier/', Get_List_Supplier, name="Get_List_Supplier"),
    path('Create_Shoppings/', Create_Shoppings, name="Create_Shoppings"),
    path('List_Shopping/', List_Shopping, name="List_Shopping"),
    path('Get_List_Shopping/', Get_List_Shopping, name="Get_List_Shopping"),
]
