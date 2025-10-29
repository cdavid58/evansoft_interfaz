from django.http import HttpResponse, JsonResponse, FileResponse
from django.urls import get_resolver, URLPattern, URLResolver
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from django.shortcuts import render, redirect
from django.conf import settings
from acttions import *
import operations
import requests
import base64
import random
import string
import uuid
import json
import os

def Logins(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return HttpResponse(Home(request).Login())
    return render(request, 'login.html')

def Logins_account_free(request,nit,user,psswd):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return HttpResponse(Home(request).Login())
    return render(request, 'login.html',{'user': user,'nit':nit,'psswd':psswd})

def OutLogin(request):
    for i,j in list(request.session.items()):
        del request.session[i]
    return redirect('Logins')

@session_required
def Index(request):
    request.session['url_app'] = operations.URL_INTERFAZ
    request.session['list_branch'] = Branch(request).List_Branch()
    request.session['list_employee'] = Employee(request).Get_List_Employee()
    return render(request, 'index.html',{"list_branch":Branch(request).List_Branch()})

@session_required
def Pricing(request):
    return render(request, 'pricing.html')






def get_all_urls():
    url_patterns = get_resolver().url_patterns
    urls = []

    def extract_urls(patterns, prefix=""):
        for pattern in patterns:
            if isinstance(pattern, URLPattern):  # URL normal (path)
                route = str(pattern.pattern)

                # Ignorar regex, parámetros dinámicos o patrones especiales
                if "(" in route or "?" in route or "<" in route:
                    continue  

                # Evitar vacíos o rutas técnicas
                if not route or route.startswith("service_worker_cache"):
                    continue

                urls.append(prefix + route)

            elif isinstance(pattern, URLResolver):  # include()
                extract_urls(pattern.url_patterns, prefix + str(pattern.pattern))

    extract_urls(url_patterns)
    return urls


def service_worker_cache(request):
    print("📡 Obteniendo todas las rutas...")

    # 📌 Obtener todas las URLs cacheables
    all_urls = get_all_urls()
    print("✅ Rutas encontradas:", all_urls)

    # Construimos las rutas completas
    cached_files = [
        request.build_absolute_uri('/Index/'),  # Página principal
        request.build_absolute_uri('/static/offline.html'),  # Página offline
    ]

    for url in all_urls:
        # Normaliza (quita dobles slashes)
        url = "/" + url.strip("/")
        cached_files.append(request.build_absolute_uri(url))

    # 📌 Agregar archivos estáticos
    static_dir = os.path.join(settings.BASE_DIR, 'static')
    static_url = settings.STATIC_URL.rstrip('/')

    for root, _, files in os.walk(static_dir):
        for file in files:
            file_path = str(os.path.relpath(os.path.join(root, file), static_dir)).replace('\\', '/')
            cached_files.append(request.build_absolute_uri(f"{static_url}/{file_path}"))

    return JsonResponse({"files": cached_files})











def txt_to_base64(filepath):
    with open(filepath, "rb") as file:
        file_content = file.read()
    base64_bytes = base64.b64encode(file_content)
    base64_string = base64_bytes.decode('utf-8')
    return base64_string


def Evangeli(request):
    customers = Customer(request).Get_All_Evangeli()
    print(customers)
    return render(request,'evangeli/bot.html',{'data_customer': customers, 'postman': txt_to_base64("/home/ubuntu/api/media/data.txt")})


@require_POST
def Create_Company(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        data = json.loads(request.body)
        payload = information(data['email'])
        result = Company(request).Create_Company(payload)
        result['success'] = True
        return JsonResponse(result)
    return JsonResponse({"status": "error", "message": "No es una solicitud AJAX", 'result': False}, status=400)

def custom_uuid():
    part1 = uuid.uuid4().hex[:8]   # 8 dígitos aleatorios
    part2 = uuid.uuid4().hex[:4]   # 4 dígitos aleatorios
    part3 = "8888"                 # parte fija
    part4 = "8888"                 # parte fija
    part5 = uuid.uuid4().hex[:12]  # 12 dígitos aleatorios
    return f"{part1}-{part2}-{part3}-{part4}-{part5}"

def generar_documento():
    # Longitud entre 7 y 11 dígitos
    longitud = random.randint(5, 6)
    return "".join(str(random.randint(0, 9)) for _ in range(longitud))

def generar_celular_col():
    # Prefijos comunes de celular en Colombia
    prefijos = [
        300, 301, 302, 304, 305, 310, 311, 312, 313, 314, 315, 316,
        320, 321, 322, 323, 350, 351
    ]
    prefijo = str(random.choice(prefijos))
    resto = "".join(str(random.randint(0, 9)) for _ in range(7))
    return prefijo + resto

def generar_password(longitud=10):
    # Caracteres seguros para URL, evitando símbolos problemáticos
    caracteres = string.ascii_letters + string.digits + "-_.~"
    return ''.join(random.choice(caracteres) for _ in range(longitud))


def information(email):
    nit = int(generar_documento())
    phone = int(generar_celular_col())

    payload = json.dumps({
      "type_document_identification_id": 3,
      "type_organization_id": 1,
      "type_regime_id": 2,
      "type_liability_id": 14,
      "documentI": nit,
      "business_name": "Empresa de Prueba",
      "merchant_registration": "0000000-00",
      "municipality_id": 1,
      "address": "DIRECCION EJEMPLO",
      "phone": phone,
      "email": email,
      "mail_host": "smtp.gmail.com",
      "mail_port": "587",
      "mail_username": email,
      "mail_password": "ccsdfjruqddyxcsjgfggqlqvttt",
      "mail_encryption": "tls",
      "type_document_id": 1,
      "phone_1": phone,
      "phone_2": phone,
      "email_branch": email,
      "type_document": 1,
      "prefix": "SETP",
      "resolution": "18760000001",
      "resolution_date": "2019-01-19",
      "technical_key": "fc8eac422eba16e22ffd8c6f94b3f40a6e38162c",
      "from": 990000000,
      "to": 995000000,
      "date_from": "2019-01-19",
      "date_to": "2030-01-19",
      "id": custom_uuid(),
      "pin": random.randint(00000,99999),
      "type_plans": 1,
      "year": False,
      "supplier": {
        "nit": "9999999",
        "name": "Proveedor General"
      },
      "employee": {
        "type_worker_id": 1,
        "sub_type_worker_id": 1,
        "payroll_type_document_identification_id": 3,
        "municipality_id": 822,
        "type_contract_id": 1,
        "identification_number": int(generar_documento()),
        "surname": "Primer Apellido",
        "second_surname": "Segundo Apellido",
        "first_name": "Primer Nombre",
        "middle_name": None,
        "address": "DIRECCION EJEMPLO",
        "salary": "1500000",
        "email": email,
        "phone": f"{phone}",
        "user": "Usuario",
        "psswd": f"{generar_password()}",
        "role": 2,
        "branch_id": 9,
        "employee_action": None
      },
      "customer": {
        "identification_number": 222222222222,
        "name": "Consumidor Final",
        "phone": f"{phone}",
        "address": "DIRECCION EJEMPLO",
        "email": email,
        "merchant_registration": "0000000-00",
        "type_document_identification": 3,
        "type_organization": 2,
        "type_regime": 2,
        "type_liability": 112,
        "municipality": 1
      }
    })
    return payload


