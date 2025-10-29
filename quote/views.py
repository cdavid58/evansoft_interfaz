from django.views.decorators.http import require_POST
from inventory.decorators import session_required
from django.http import JsonResponse
from django.shortcuts import render
from acttions import Quote
import traceback, json

def Crete_Quote(request, type_document):
	request.session["type_document"] = type_document
	return render(request,'quote/create_quote.html')

@require_POST
def Send_Quote(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            data = json.loads(request.body.decode('utf-8'))
            _result = Quote(request).Create_Quote(data)
            return JsonResponse(_result)	
        return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        print(e, 'ERROR SEND DIAN')
        return JsonResponse({"error": str(e)}, status=500)

@session_required
def Get_List_Quote(request):
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
                "search": search_value,
                "type_document": request.session['type_document']
            }
            quote_data = Quote(request).Get_List_Quote(value)  # Recibe el diccionario completo
            quote_data['quote'] = sorted(quote_data['quote'], key=lambda x: x['number'], reverse=True)

            quote_list = quote_data.get('quote', [])  # Extrae la lista de facturas
            total_products = quote_data.get('total_products', 0)  # Extrae el total de productos correctamente

            data = [
                {
                    "id": p.get('id', ''),
                    "prefix": p.get('prefix', ''),
                    "quote": f"{p.get('prefix', '')} - {p.get('number', '')}",
                    "number": f"{p.get('number', '')}",
                    "customer": p.get('customer__name', ''),
                    "phone": p.get('customer__phone', ''),
                    "status": p.get('status', ''),
                    "total": p.get('total', ''),
                    "date_only": p.get('date_only', ''),
                    "bill": p.get('bill', ''),
                } for p in quote_list
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


def Print_Quote(request, quote_id, type_document):
    result = None
    message = None
    branch_id = request.session['tmp_branch_id'] if 'tmp_branch_id' in request.session else request.session['branch_id']
    if 'tmp_branch_id' in request.session:
        del request.session['tmp_branch_id']
    result = Quote(request).Get_Full_Quote(branch_id, quote_id, type_document)
    data = result
    subtotals = 0
    valtax = 0
    ico = 0
    discount = 0
    total = 0
    neto = 0
    for i in data['details']:
        quantity = i['quantity']
        price = i['price']
        tax = i['tax']
        total = round(float((price - i['ico'])), 2)
        cost = total / (1 + (tax / 100))
        _valtax = total - cost
        _discount = i['discount'] if i['discount'] > 100 else cost * (i['discount'] /100)
        cost -= _discount
        total = cost * (1 + (tax / 100))
        _valtax = total - cost
        neto += price
        i['cost'] = round(float(cost), 2)
        i['valtax'] = _valtax
        i['subtotal'] = cost * quantity
        i['discount'] = _discount
        
        valtax += _valtax * quantity
        subtotals += round(float(cost  * quantity),2)
        discount += round(float(_discount  * quantity), 2)
        ico += round(float(i['ico']  * quantity ), 2)

    totals = {
        "subtotals": subtotals,
        "tax": valtax,
        "ico": ico,
        "discount": discount,
        'totals': round(float(subtotals + valtax + ico),2),
        'totals_with_discount': round(float((subtotals + valtax + ico)), 2),
        'neto': round(float(neto), 2),
    }
    return render(request,f'quote/ticket.html',{
        'quote':data['quote'],
        'details':data['details'],
        'customer':data['customer'],
        'list_taxes':data['list_taxes'],
        'totals':totals,
        'company':data['company'],
        'branch':data['branch'],
        'type_document':data['quote']['type_document'],
    })


@require_POST
def Create_PDF_Quote(request):
    try:
        if request.headers.get('x-requested-with') != 'XMLHttpRequest':
            return JsonResponse({"error": "Solicitud no válida"}, status=400)

        with open("llegamos.txt",'w') as file:
            file.write(str(request.POST))

        number = request.POST.get('number')
        branch_id = request.session['tmp_branch_id']
        type_document = request.POST.get('type_document')

        if not all([number, branch_id, type_document]):
            return JsonResponse({"error": "Faltan parámetros requeridos"}, status=400)

        # Lógica del envío
        response_data = Quote(request).Create_PDF({
            'number': number,
            'branch_id': branch_id,
            'type_document': type_document,
        })

        return JsonResponse({"status": "success", "data": response_data})

    except Exception as e:
        print("ERROR SEND EMAIL INVOICE:", e)
        with open("llegamos_error.txt",'w') as file:
            file.write(str(e))
        return JsonResponse({"error": str(e)}, status=500)

@require_POST
def Bill_Quote(request):
    try:
        if request.headers.get("x-requested-with") != "XMLHttpRequest":
            return JsonResponse({"error": "Solicitud no válida"}, status=400)
        # Parsear JSON
        data = json.loads(request.body.decode("utf-8"))
        result = Quote(request).Bill_Quote(data)
        return JsonResponse({"status": "success", "data": result})

    except Exception as e:
        return JsonResponse({"status": "error", "message": str(e)}, status=500)

    except Exception as e:
        print("ERROR SEND EMAIL INVOICE:", e)
        with open("llegamos_error.txt",'w') as file:
            file.write(str(e))
        return JsonResponse({"error": str(e)}, status=500)









