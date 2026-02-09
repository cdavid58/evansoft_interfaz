from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from django.http import HttpResponse,JsonResponse
from acttions import Supplier, Shopping, Branch
from django.http import HttpResponse 
from django.shortcuts import render
import traceback, json

@session_required
def Create_Shopping(request):
	return render(request,'shopping/create_shopping.html',{"list_branch":Branch(request).List_Branch()})

@session_required
def Get_List_Supplier_(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            company_id = request.session['company_id']
            if not company_id:
                return JsonResponse({"error": "Compania no especificada"}, status=400)
            print(f"🔹 Filtrando productos por compania: {company_id}")
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "company_id": int(company_id),
                "search": search_value
            }

            _supplier = Customer(request).Get_All_Customer(value)
            print(_supplier)

            supplier = _supplier.get('supplier', [])
            total_products = _supplier.get('total_products', 0)
            data = [
                {
                    "id": p.get('id', ''),
                    "identification_number": p.get('identification_number', ''),
                    "name": p.get('name', ''),
                    "phone": p.get('phone', ''),
                    "address": p.get('address', ''),
                    "email": p.get('email', '')
                } for p in supplier
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
@csrf_exempt
def Create_Shoppings(request):
    result = False
    message = None
    _data = None
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
            data = json.loads(request.body)
            print(data)
            _result = Shopping(request).Create_Shopping(data)
            print(_result,'_result')
            _data = _result
            message = "Successfully"
            result = True
    except Exception as e:
        message = str(e)
    return JsonResponse({'result':result, 'message':message,'data': _data})

@session_required
def List_Shopping(request):
    return render(request,'shopping/list.html',{"list_branch":Branch(request).List_Branch()})


@session_required
def Get_List_Shopping(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            pk_branch = int(request.GET.get('branch_id', 1))
            if not pk_branch:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            page = start // length + 1
            per_page = length
            request.session['tmp_branch_id'] = pk_branch
            value = {
                "page": page,
                "per_page": per_page,
                "branch_id": int(pk_branch),
                "search": search_value
            }
            shopping_data = Shopping(request).Get_List_Shopping(value)  # Recibe el diccionario completo
            print(shopping_data)

            shopping_list = shopping_data.get('shopping', [])  # Extrae la lista de facturas
            total_products = shopping_data.get('total_products', 0)  # Extrae el total de productos correctamente

            data = [
                {
                    "id": p.get('id', ''),
                    "invoice": f"{p.get('number', '')}",
                    "number": f"{p.get('number', '')}",
                    "customer": p.get('supplier__name', ''),
                    "phone": p.get('supplier__phone', ''),
                    "status": p.get('status', ''),
                    "total": p.get('total', ''),
                    "date_only": p.get('date_only', ''),
                    "anulled": p.get('anulled', ''),
                } for p in shopping_list
            ]

            return JsonResponse({
                "draw": draw,
                "recordsTotal": total_products,
                "recordsFiltered": total_products,
                "data": data
            }, safe=False)

        return JsonResponse({"error": "Invalid request"}, status=400)
    except Exception as e:
        print("🚨 ERROR en Get_List_Invoice:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)