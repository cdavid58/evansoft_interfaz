from django.urls import path
from .views import *

urlpatterns = [
    path('List_Supplier/', List_Supplier, name="List_Supplier"),
    path('Create_Supplier/', Create_Supplier, name="Create_Supplier"),
    path('Save_Supplier/', Save_Supplier, name="Save_Supplier"),
    path('Get_List_Supplier/', Get_List_Supplier, name="Get_List_Supplier"),
    path('Edit_Supplier/<int:nit>/', Edit_Supplier, name="Edit_Supplier"),
    path('Delete_Supplier/', Delete_Supplier, name="Delete_Supplier"),
    path('Get_Supplier_By_Name/', Get_Supplier_By_Name, name="Get_Supplier_By_Name"),
]
