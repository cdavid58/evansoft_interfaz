from django.urls import path
from .views import *

urlpatterns = [
    path('List_Inventory/', List_Inventory, name="List_Inventory"),
    path('Create_Product/', Create_Product, name="Create_Product"),
    path('Edit/<str:code>/<int:branch_id>/', Edit, name="Edit"),
    path('Get_List_Product/', Get_List_Product, name="Get_List_Product"),
    path('Save_Product/', Save_Product, name="Save_Product"),
    path('Delete_Inventory/', Delete_Inventory, name="Delete_Inventory"),
    path('Reserved/', Reserved, name="Reserved"),
    path('View_Sales_Product/', View_Sales_Product, name="View_Sales_Product"),
    path('Get_Sales_Predictions/', Get_Sales_Predictions, name="Get_Sales_Predictions"),
    path('Get_Profit_Report/', Get_Profit_Report, name="Get_Profit_Report"),
    path('Upload_Inventory_JSON/', Upload_Inventory_JSON, name="Upload_Inventory_JSON"),
    path('Export_Inventory_To_Excel/', Export_Inventory_To_Excel, name="Export_Inventory_To_Excel"),
    path('Generate_Movement_History_Report/', Generate_Movement_History_Report, name="Generate_Movement_History_Report"),
    path('Scan_Inventory/', Scan_Inventory, name="Scan_Inventory"),
    path('Loan/', Loan, name="Loan"),
    path('Return_One_Product/', Return_One_Product, name="Return_One_Product"),
    path('Sales_By_Product/', Sales_By_Product, name="Sales_By_Product"),
]
