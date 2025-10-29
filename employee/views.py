from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from acttions import Branch, Employee, Setting
from django.http import JsonResponse
from django.shortcuts import render
import traceback
import json

@session_required
def List_Employee(request):
	return render(request,'employee/list.html', {
        "list_branch":Branch(request).List_Branch()})

@session_required
def Add_Employee(request):
    roles = Employee(request).Get_All_Roles()
    return render(request,'employee/add.html', {"list_branch":Branch(request).List_Branch(),
        'roles': roles,
        'type_document_identification':Setting(request).Get_Data_General("Get_All_Type_Document_Identification"),
        'type_worker':Setting(request).Get_Data_General("Get_All_Type_Worker"),
        'sub_type_worker':Setting(request).Get_Data_General("Get_All_Sub_Type_Worker"),
        'type_contract':Setting(request).Get_Data_General("Get_All_Type_Contract"),
        'municipality':Setting(request).Get_Data_General("Get_All_Municipality"),})

@session_required
def Get_List_Employee(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            pk_branch = request.GET.get('pk_branch', None)
            if not pk_branch:
                return JsonResponse({"error": "Sucursal no especificada"}, status=400)
            print(f"🔹 Filtrando productos por sucursal: {pk_branch}")
            page = start // length + 1
            per_page = length
            value = {
                "page": page,
                "per_page": per_page,
                "branch_id": int(pk_branch),
                "search": search_value
            }
            employee = Employee(request).Get_All_Employee(value)
            products = employee.get('employee', [])
            total_products = employee.get('total_products', 0)
            data = [
                {
                    "pk": p.get('id', ''),
                    "identification_number": p.get('identification_number', ''),
                    "first_name": f"{p.get('first_name', '')} {p.get('surname', '')}" ,
                    "role__name": p.get('role__name', ''),
                    "email": p.get('email', ''),
                    "phone": p.get('phone', ''),
                    "active": p.get('active', ''),
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
def Edit_Employee(request, employee_id):
    employee = Employee(request).Get_Employee(employee_id)
    roles = Employee(request).Get_All_Roles()
    list_branch = Branch(request).List_Branch()
    print(list_branch)
    return render(request,'employee/edit.html',{
        'employee': employee['employee'],
        'roles': roles,
        'type_document_identification':Setting(request).Get_Data_General("Get_All_Type_Document_Identification"),
        'type_worker':Setting(request).Get_Data_General("Get_All_Type_Worker"),
        'sub_type_worker':Setting(request).Get_Data_General("Get_All_Sub_Type_Worker"),
        'type_contract':Setting(request).Get_Data_General("Get_All_Type_Contract"),
        'municipality':Setting(request).Get_Data_General("Get_All_Municipality"),
        "list_branch":list_branch
    })

@session_required
@csrf_exempt
def Save_Employee(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        data = request.POST.copy()
        data['employee_action'] = request.session['pk_employee']
        rol = 'Todos'
        if int(data['role']) == 1:
            rol = "Facturador"
        if int(data['role']) == 4:
            rol = "Contador"
        if int(data['role']) == 3:
            rol = "Administativo"
        request.session['rols'] = rol
        return JsonResponse(Employee(request).Create_Employee(data))

@session_required
@csrf_exempt
def Delete_Employee(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        try:
            data = json.loads(request.body)
            data['employee_action'] = request.session['pk_employee']
            print(data)
            result = Employee(request).Delete_Employee(data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)


def Payroll_Basic(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse(Employee(request).Payroll_Basic())
    except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)


def Profile(request, employee_id):
    employee = Employee(request).Get_Employee(employee_id)
    return render(request,'payroll/profile.html',{'employee': employee['employee']})

def Send_Payroll(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        try:
            data = json.loads(request.body)
            result = Employee(request).Advanced_Payroll(data)
            print(result)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    return JsonResponse({"error": "Invalid request"}, status=400)