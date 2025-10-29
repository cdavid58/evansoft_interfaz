from django.urls import path
from .views import *

urlpatterns = [
    path('List_Employee/', List_Employee, name="List_Employee"),
    path('Get_List_Employee/', Get_List_Employee, name="Get_List_Employee"),
    path('Edit_Employee/<int:employee_id>/', Edit_Employee, name="Edit_Employee"),
    path('Save_Employee/', Save_Employee, name="Save_Employee"),
    path('Add_Employee/', Add_Employee, name="Add_Employee"),
    path('Delete_Employee/', Delete_Employee, name="Delete_Employee"),
    path('Payroll_Basic/', Payroll_Basic, name="Payroll_Basic"),
    path('Profile/<int:employee_id>/', Profile, name="Profile"),
    path('Send_Payroll/', Send_Payroll, name="Send_Payroll"),
]

