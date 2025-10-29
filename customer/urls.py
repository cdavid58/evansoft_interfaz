from django.urls import path
from .views import *

urlpatterns = [
    path('List_Customer/', List_Customer, name="List_Customer"),
    path('Get_List_Customer/', Get_List_Customer, name="Get_List_Customer"),
    path('Create_Customer/', Create_Customer, name="Create_Customer"),
    path('Edit_Customer/<int:identification_number>/', Edit_Customer, name="Edit_Customer"),
    path('Save_Customer/', Save_Customer, name="Save_Customer"),
    path('Upload_File/', Upload_File, name="Upload_File"),
    path('Delete_Customer/', Delete_Customer, name="Delete_Customer"),
    path('Get_Customer/', Get_Customer, name="Get_Customer"),
]
