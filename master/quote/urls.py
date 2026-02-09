from django.urls import path
from .views import *

urlpatterns = [
    path('Crete_Quote/<int:type_document>/', Crete_Quote, name="Crete_Quote"),
    path('Send_Quote/', Send_Quote, name="Send_Quote"),
    path('Get_List_Quote/', Get_List_Quote, name="Get_List_Quote"),
    path('Create_PDF_Quote/', Create_PDF_Quote, name="Create_PDF_Quote"),
    path('Bill_Quote/', Bill_Quote, name="Bill_Quote"),
    path('Print_Quote/<int:quote_id>/<int:type_document>/', Print_Quote, name="Print_Quote"),
]
