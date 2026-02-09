from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from django.http import HttpResponse,JsonResponse
from acttions import Customer, Setting, Branch
from django.core.paginator import Paginator
from django.shortcuts import render
import pdfplumber
import traceback
import base64
import json


@session_required
def List_Customer(request):
	return render(request,'customer/list.html')

@session_required
def Upload_File(request):
    if request.method == 'POST' and request.FILES.get('file'):
        file = request.FILES['file']
        base64_data = convertir_a_base64(file)
        result = Customer(request).Create_Customer_By_RUT(base64_data)
        return JsonResponse({
            'message': result['message'],
            'filename': file.name,
            'base64': base64_data,
            'result': result['result']
        })
    return JsonResponse({'error': 'Método no permitido'}, status=400)

def convertir_a_base64(archivo):
    base64_bytes = base64.b64encode(archivo.read())
    return base64_bytes.decode("utf-8")


@session_required
def Edit_Customer(request, identification_number):
    customer = Customer(request).Get_Customer({
        'company_id': request.session['company_id'],
        'identification_number':identification_number
    })
    return render(request,'customer/edit.html',{
        'customer': customer['customer'],
        'type_document_identification':Setting(request).Get_Data_General("Get_All_Type_Document_Identification"),
        'type_organization':Setting(request).Get_Data_General("Get_All_Type_Organization"),
        'type_regime':Setting(request).Get_Data_General("Get_All_Type_Regime"),
        'type_liability':Setting(request).Get_Data_General("Get_All_Type_Liability"),
        'municipality':Setting(request).Get_Data_General("Get_All_Municipality"),
    })

@session_required
def Create_Customer(request):

    return render(request,'customer/add.html',{
        'type_document_identification':Setting(request).Get_Data_General("Get_All_Type_Document_Identification"),
        'type_organization':Setting(request).Get_Data_General("Get_All_Type_Organization"),
        'type_regime':Setting(request).Get_Data_General("Get_All_Type_Regime"),
        'type_liability':Setting(request).Get_Data_General("Get_All_Type_Liability"),
        'municipality':Setting(request).Get_Data_General("Get_All_Municipality"),
        "list_branch":Branch(request).List_Branch(),
        })

@session_required
@csrf_exempt
def Save_Customer(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
            body_unicode = request.body.decode('utf-8')
            raw_data = json.loads(body_unicode)

            # Verificamos si es lista o dict
            if isinstance(raw_data, list) and len(raw_data) > 0:
                data = raw_data[0]
            elif isinstance(raw_data, dict):
                data = raw_data
            else:
                raise ValueError("Formato de datos no válido para 'Save_Customer'")

            # Limpiar campos vacíos
            data = {k: v for k, v in data.items() if v != ""}
            data['company_id'] = request.session['company_id']
            data['employee_id'] = request.session['pk_employee']

            print("📦 Datos recibidos:", data)

            result = Customer(request).Create_Customer(data)
            return JsonResponse(result)
        else:
            return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        import traceback
        print("🚨 ERROR en Save_Customer:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)


@session_required
def Get_List_Customer(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            company_id = request.session['company_id']
            if not company_id:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "company_id": int(company_id),
                "search": search_value
            }
            _customer = Customer(request).Get_All_Customer(value)
            customer = _customer.get('customer', [])
            total_products = _customer.get('total_products', 0)
            data = [
                {
                    "id": p.get('id', ''),
                    "identification_number": p.get('identification_number', ''),
                    "name": p.get('name', ''),
                    "phone": p.get('phone', ''),
                    "address": p.get('address', ''),
                    "email": p.get('email', '')
                } for p in customer
            ]
            return JsonResponse({
                "draw": draw,
                "recordsTotal": total_products,
                "recordsFiltered": total_products,
                "data": data
            }, safe=False)
        return JsonResponse({"error": "Invalid request"}, status=400)
    except Exception as e:
        print(e)
        print("🚨 ERROR en Get_List_Product:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

@session_required
@csrf_exempt  # Solo si usas POST sin CSRF token
def Get_Customer_By_Name(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        try:
            result = Customer(request).Get_Customer_By_Name()
            return JsonResponse(result.get('customer', []), safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)

@session_required
@csrf_exempt
def Delete_Customer(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        try:
            data = json.loads(request.body)
            result = Customer(request).Delete_Customer(data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)

def Get_Customer(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = request.GET
            print(data)
            customer = Customer(request).Get_Customer(data)
            print(customer)
            return JsonResponse(customer)
        except Exception as e:
            print(e)
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)

