from django.urls import path
from .views import *

urlpatterns = [
    path('Create_Invoice/<int:type_document>/', Create_Invoice, name="Create_Invoice"),
    path('Get_Customer_By_Name/', Get_Customer_By_Name, name="Get_Customer_By_Name"),
    path('Get_Product_By_Name/', Get_Product_By_Name, name="Get_Product_By_Name"),
    path('Get_Resolution/', Get_Resolution, name="Get_Resolution"),
    path('Get_List_Invoice/', Get_List_Invoice, name="Get_List_Invoice"),
    path('List_Invoice/<int:type_document>/', List_Invoice, name="List_Invoice"),
    path('Get_All_Inventory/', Get_All_Inventory, name="Get_All_Inventory"),
    path('Send_Dian/', Send_Dian, name="Send_Dian"),
    path('Return_Product/', Return_Product, name="Return_Product"),
    path('Finalizado/', Finalizado, name="Finalizado"),
    path('Generate_Closure_Report/', Generate_Closure_Report, name="Generate_Closure_Report"),
    path('Print_Invoice/<int:number>/<int:type_document>/', Print_Invoice, name="Print_Invoice"),
    path('Export_Sales_Report/', Export_Sales_Report, name="Export_Sales_Report"),
    path('Generate_Journal_Report/', Generate_Journal_Report, name="Generate_Journal_Report"),
    path('Generate_Closure_Report_By_Date/', Generate_Closure_Report_By_Date, name="Generate_Closure_Report_By_Date"),
    path('Generate_Closure_Report_By_Dates/', Generate_Closure_Report_By_Dates, name="Generate_Closure_Report_By_Dates"),
    path('View_Invoice/<int:number>/', View_Invoice, name="View_Invoice"),
    path('Get_All_accounts_Receivable_View/', Get_All_accounts_Receivable_View, name="Get_All_accounts_Receivable_View"),
    path('Get_All_accounts_Receivable/', Get_All_accounts_Receivable, name="Get_All_accounts_Receivable"),
    path('Send_Email_Invoice/', Send_Email_Invoice, name="Send_Email_Invoice"),
    path('Anulled_Invoice/', Anulled_Invoice, name="Anulled_Invoice"),
    path('Close_Box_Days/', Close_Box_Days, name="Close_Box_Days"),
    path('Create_PDF/', Create_PDF, name="Create_PDF"),
    path('Get_List_Credit_Note/', Get_List_Credit_Note, name="Get_List_Credit_Note"),
    path('Export_Invoices_To_Excel/', Export_Invoices_To_Excel, name="Export_Invoices_To_Excel"),
    path('Send_Dian_/', Send_Dian_, name="Send_Dian_"),

]
