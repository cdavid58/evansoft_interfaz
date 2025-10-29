from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from acttions import Company, Setting, Branch
from django.http import JsonResponse
from django.shortcuts import render
import base64
import json

@session_required
def Setting_Company(request):
    return render(request,'setting/company.html', {'data': Company(request).Get_Data_Company(),
        'type_document_identification':Setting(request).Get_Data_General("Get_All_Type_Document_Identification"),
        'type_organization':Setting(request).Get_Data_General("Get_All_Type_Organization"),
        'type_regime':Setting(request).Get_Data_General("Get_All_Type_Regime"),
        'type_liability':Setting(request).Get_Data_General("Get_All_Type_Liability"),
        'municipality':Setting(request).Get_Data_General("Get_All_Municipality"),
    })

@session_required
def Update_Company(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse(Company(request).Update_Company())

@session_required
@csrf_exempt
def Update_Logo(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest' and request.method == "POST":
        if 'logo' in request.FILES:
            logo_file = request.FILES['logo']
            logo_data = logo_file.read()
            base64_logo = base64.b64encode(logo_data).decode('utf-8')
            mime = logo_file.content_type
            data_uri = f"data:{mime};base64,{base64_logo}"
            values = {
                "company_id": request.session['company_id'],
                "img": data_uri
            }
            Company(request).Update_Logo(values)
            return JsonResponse({
                'result': True,
                'logo_base64': data_uri
            })
        else:
            return JsonResponse({'result': False, 'message': 'No se encontró el archivo'}, status=400)
    return JsonResponse({'result': False, 'message': 'Petición no válida'}, status=400)

@session_required
def List_Branch(request):
    return render(request,'setting/list.html', {"list_branch":Branch(request).List_Branch()})

@session_required
def Setting_Branch(request, branch_id):
    request.session['branch_select'] = branch_id
    return render(request,'setting/setting_branch.html',{'data': Branch(request).Get_Branch()['branch'], 'type_document':Setting(request).Get_Data_General("Get_All_Type_Document")})

def clean_querydict(querydict):
    cleaned = {}
    for key, value in querydict.items():
        key = str(key).strip().replace('"', '')
        val = str(value).strip().replace('"', '')
        val = str(val).replace(',','.')
        cleaned[key] = val
    print(cleaned)
    return cleaned

@session_required
@require_POST
def Update_Branch(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            data['pk_company'] = request.session['company_id']
            cleaned_data = clean_querydict(data)
            result = Branch(request).Create_Or_Update_Branch(cleaned_data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'result': False, 'message': f'Error: {str(e)}'}, status=400)
    return JsonResponse({'result': False, 'message': 'Petición no válida'}, status=400)

@session_required
@csrf_exempt
def Update_Resolution_PDF_Dian(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            raw_data = json.loads(request.body)
            result = Branch(request).Update_Resolution_PDF_Dian(raw_data)
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'result': False, 'message': f"Error inesperado: {str(e)}"})
    else:
        return JsonResponse({'result': False, 'message': "Método no permitido o no es una petición AJAX."})

@session_required
@csrf_exempt
def Create_Or_Update_License(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            result = Branch(request).Create_Or_Update_License()
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'result': False, 'message': f"Error inesperado: {str(e)}"})
    else:
        return JsonResponse({'result': False, 'message': "Método no permitido o no es una petición AJAX."})

def Activate_Discount(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            result = Branch(request).Activate_Discount()
            return JsonResponse(result)
        except Exception as e:
            return JsonResponse({'result': False, 'message': f"Error inesperado: {str(e)}"})
    else:
        return JsonResponse({'result': False, 'message': "Método no permitido o no es una petición AJAX."})



