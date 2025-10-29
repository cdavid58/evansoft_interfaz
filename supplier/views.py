from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from django.http import HttpResponse,JsonResponse
from django.core.paginator import Paginator
from django.shortcuts import render
from acttions import Supplier
import traceback, json

@session_required
def List_Supplier(request):
	return render(request,'supplier/list.html')

@session_required
def Create_Supplier(request):
    return render(request,'supplier/add.html')

@session_required
def Save_Supplier(request):
    try:
        if request.method == "POST":
            data = json.loads(request.body.decode('utf-8'))[0]
            data['company_id'] = request.session['company_id']
            data['employee_id'] = request.session['pk_employee']
            result = Supplier(request).Create_Or_Update_Supplier(data)
            return JsonResponse(result)
        else:
            return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        print("🚨 ERROR en Save_Supplier:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

@session_required
def Get_List_Supplier(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            company_id = request.session['company_id']
            if not company_id:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            print(f"🔹 Filtrando productos por sucursal: {company_id}")
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "company_id": int(company_id),
                "search": search_value
            }
            supplier = Supplier(request).Get_List_Supplier(value)
            supplier_list = supplier.get('supplier', [])
            total_products = supplier.get('total_products', 0)
            data = [
                {
                    "id": p.get('id', ''),
                    "nit": p.get('nit', ''),
                    "name": p.get('name', ''),
                    "phone": p.get('phone', ''),
                    "address": p.get('address', ''),
                    "email": p.get('email', '')
                } for p in supplier_list
            ]
            return JsonResponse({
                "draw": draw,
                "recordsTotal": total_products,
                "recordsFiltered": total_products,
                "data": data
            }, safe=False)
        return JsonResponse({"error": "Invalid request"}, status=400)
    except Exception as e:
        print("🚨 ERROR en Get_List_Product:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

@session_required
def Edit_Supplier(request, nit):
    supplier = Supplier(request).Get_Supplier({
        'company_id': request.session['company_id'],
        'nit':nit
    })
    return render(request,'supplier/edit.html',{
        'supplier': supplier['supplier'],
        'nit': nit
    })

@session_required
def Delete_Supplier(request):
    try:
        if request.method == "POST":
            data = json.loads(request.body.decode('utf-8'))
            print("🔍 Datos recibidos:", data)
            if "nit" not in data or "company_id" not in data:
                return JsonResponse({"error": "Faltan datos requeridos"}, status=400)
            result = Supplier(request).Delete_Supplier(data)
            return JsonResponse(result)
        else:
            return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        print("🚨 ERROR en Delete_Inventory:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

@session_required
@csrf_exempt  # Solo si usas POST sin CSRF token
def Get_Supplier_By_Name(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        try:
            result = Supplier(request).Get_Supplier_By_Name()
            return JsonResponse(result.get('supplier', []), safe=False)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)
