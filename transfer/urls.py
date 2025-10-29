from django.urls import path
from .views import *

urlpatterns = [
    path('Send_Transfer/', Send_Transfer, name="Send_Transfer"),
    path('Get_List_Transfer/', Get_List_Transfer, name="Get_List_Transfer"),
    path('Create_Transfer/<int:type_document>/', Create_Transfer, name="Create_Transfer"),
    path('Get_List_Notifications/', Get_List_Notifications, name="Get_List_Notifications"),
    path('Transfer_Accepted/', Transfer_Accepted, name="Transfer_Accepted"),
    path('Anulled_Transfer/', Anulled_Transfer, name="Anulled_Transfer"),
    path('Print_Transfer/<int:transfer_id>/<int:type_document>/', Print_Transfer, name="Print_Transfer"),
]
