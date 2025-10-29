from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from django.http import HttpResponse,JsonResponse
from django.core.paginator import Paginator
from acttions import Branch, Inventory, Setting
from django.shortcuts import render
import traceback, json
from .decorators import session_required

@session_required
def List_Inventory(request):
	return render(request,'inventory/list.html', {"list_branch":Branch(request).List_Branch()})

@session_required
def Create_Product(request):
    inv = Inventory(request).Get_All_Category()['list_categories']
    return render(request,'inventory/add.html', {
        "list_branch":Branch(request).List_Branch(),
        "categories": inv,
        'unit_measures':Setting(request).Get_Data_General("Get_All_Unit_Measures")
        })

@session_required
def Edit(request,code, branch_id):
    data = {
        "code": code,
        "branch_id": branch_id
    }
    inv = Inventory(request)
    product = inv.Get_Product(data)['product']
    request.session['tmp_product_id'] = product['id']
    return render(request,'inventory/edit.html',{
        'product': product,
        'code': code,
        'branch_id': branch_id,
        "taxes": [0,5,19],
        "categories": inv.Get_All_Category()['list_categories'],
        'unit_measures':Setting(request).Get_Data_General("Get_All_Unit_Measures")
        })


@session_required
def Get_List_Product(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            pk_branch = request.GET.get('pk_branch', None)
            if not pk_branch:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "pk_branch": int(pk_branch),
                "search": search_value
            }
            inventory = Inventory(request).Get_Products_By_Branch(value)
            products = inventory.get('products', [])
            total_products = inventory.get('total_products', 0)
            data = [
                {
                    "pk": p.get('pk', ''),
                    "codigo": p.get('code', ''),
                    "producto": p.get('name', ''),
                    "caja": p.get('bale', ''),
                    "display": p.get('display', ''),
                    "brand": p.get('brand', ''),
                    "unidades": p.get('unit', '')
                } for p in products
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
def Save_Product(request):
    try:
        if request.method == "POST":
            data = json.loads(request.body.decode('utf-8'))
            result = Inventory(request).Create_Inventory(data)
            with open("RESULT_ENVIO_SAVE_PRODUCT.txt",'w') as file:
                file.write(str(result))
            return JsonResponse(result)
        else:
            return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        with open("ERROR_500_ENVIO_SAVE_PRODUCT.txt",'w') as file:
            file.write(str(e))
        print("🚨 ERROR en Save_Product:", traceback.format_exc())
        return JsonResponse({"error": str(e)}, status=500)

@session_required
def Delete_Inventory(request):
    try:
        if request.method == "POST":
            data = json.loads(request.body.decode('utf-8'))
            if "product_id" not in data or "pk_branch" not in data:
                return JsonResponse({"error": "Faltan datos requeridos"}, status=400)
            data['employee_id'] = request.session['pk_employee']
            result = Inventory(request).Delete_Inventory(data)
            return JsonResponse(result)
        else:
            return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)  

@session_required
def Reserved(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        result = Inventory(request).Reserved()
        return JsonResponse(result)

@session_required
def View_Sales_Product(request):
    return render(request,'inventory/get_sales_predictions.html', {"list_branch":Branch(request).List_Branch()})

@session_required
def Get_Sales_Predictions(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            pk_branch = request.GET.get('pk_branch', None)
            if not pk_branch:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "branch_id": int(pk_branch),
                "search": search_value
            }
            inventory = Inventory(request).Get_Sales_Predictions(value)
            products = inventory.get('top_selling_products', [])
            total_products = inventory.get('total_products', 0)
            data = [
                {
                    "codigo": p.get('product__code', ''),
                    "producto": p.get('product__name', ''),
                    "total_sold": p.get('total_sold', '')
                } for p in products
            ]
            return JsonResponse({
                "draw": draw,
                "recordsTotal": total_products,
                "recordsFiltered": total_products,
                "data": data
            }, safe=False)
        return JsonResponse({"error": "Invalid request"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@session_required
def Get_Profit_Report(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse(Inventory(request).Get_Profit_Report())

@session_required
def Export_Inventory_To_Excel(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse(Inventory(request).Export_Inventory_To_Excel({'branch_id':int(request.GET['branch_id'])}))


def Upload_Inventory_JSON(request):
    if request.method == "POST" and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            if data['branch_id'] is None:
                print("Todas las Sucursales")
            else:
                print("Un Sucursal en especifico.")
            result = True
            message = "Inventario cargado exitosamente."
            return JsonResponse({'result': result, 'message': message})
        except json.JSONDecodeError:
            return JsonResponse({'result': False, 'message': "Error al procesar el archivo."})
        except Exception as e:
            return JsonResponse({'result': False, 'message': f"Error: {str(e)}"})

    return JsonResponse({'result': False, 'message': "Método no permitido."})

@session_required
@require_POST
def Generate_Movement_History_Report(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            branch_id = data.get('branch_id')
            start_date = data.get('start_date')
            end_date = data.get('end_date')
            data = {'branch_id':branch_id, 'start_date':start_date,'end_date':end_date}
            print(data)
            report_name = Inventory(request).Generate_Movement_History_Report(data)
            print(report_name)
            return JsonResponse({
                'result': report_name['result'],
                'path_report': report_name['path_report'],
                "message": report_name['message']
            })
        except Exception as e:
            return JsonResponse({
                'result': False,
                'message': f"Ocurrió un error: {str(e)}"
            })
    return JsonResponse({'result': False, 'message': 'Solicitud inválida'})

@require_POST
def Scan_Inventory(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = request.POST
            print(data, 'DATOS')
            code = data['code']
            type_unit = data['type_unit']
            quantity = data['quantity']
            branch_id = request.session['branch_id']
            input_data = {
              "branch_id": branch_id or 15,
              "code": code,
              "type_unit": int(type_unit),
              "quantity": int(quantity)
            }
            result = Inventory(request).Scan_Inventory(input_data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({
                'result': False,
                'message': f"Ocurrió un error: {str(e)}"
            })

@require_POST
def Loan(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = request.POST
            result = Inventory(request).Loan(data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({
                'result': False,
                'message': f"Ocurrió un error: {str(e)}"
            })
            

@require_POST
def Sales_By_Product(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body.decode("utf-8"))  # ✅ leer JSON correctamente
            result = Inventory(request).Sales_By_Product(data)
            return JsonResponse(result)
        except Exception as e:
            with open("error_sales_by_product.txt", "w", encoding="utf-8") as file:
                file.write(str(e))
            return JsonResponse({
                "result": False,
                "message": f"Ocurrió un error: {str(e)}"
            })


@require_POST
def Return_One_Product(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = request.POST
            print(data, 'DATOS')

            input_data = {
                'employee_id': data.get('employee_id'),
                'code': data.get('code')
            }

            # Llama a tu lógica de reposición de inventario
            result = Inventory(request).Return_One_Product(input_data)  # <- Aquí debe estar tu lógica real

            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({
                'result': False,
                'message': f"Ocurrió un error: {str(e)}"
            })
    else:
        return JsonResponse({'result': False, 'message': 'Petición inválida'})




