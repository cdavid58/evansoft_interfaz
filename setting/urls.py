from django.urls import path
from .views import *

urlpatterns = [
    path('Setting_Company/', Setting_Company, name="Setting_Company"),
    path('Update_Company/', Update_Company, name="Update_Company"),
    path('Update_Logo/', Update_Logo, name="Update_Logo"),
    path('List_Branch/', List_Branch, name="List_Branch"),
    path('Setting_Branch/<int:branch_id>/', Setting_Branch, name="Setting_Branch"),
    path('Update_Branch/', Update_Branch, name="Update_Branch"),
    path('Update_Resolution_PDF_Dian/', Update_Resolution_PDF_Dian, name="Update_Resolution_PDF_Dian"),
    path('Create_Or_Update_License/', Create_Or_Update_License, name="Create_Or_Update_License"),
    path('Activate_Discount/', Activate_Discount, name="Activate_Discount"),
]