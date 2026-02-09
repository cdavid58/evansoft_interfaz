from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from acttions import Transfer, Branch
from django.http import JsonResponse
from django.shortcuts import render
from datetime import datetime
import traceback
import json

def Create_Transfer(request, type_document):
	request.session["type_document"] = type_document
	list_branch = Branch(request).List_Branch()
	return render(request,'transfer/create_transfer.html',{"list_branch":list_branch})

@session_required
def Get_List_Transfer(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            draw = int(request.GET.get('draw', 1))
            start = int(request.GET.get('start', 0))
            length = int(request.GET.get('length', 10))
            search_value = request.GET.get('search[value]', '').strip()
            pk_branch = int(request.GET.get('branch_id', 1))
            type_document = int(request.GET.get('type_document', 1))
            input_data = request.GET.get('input', True)
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
                "type_document": 28,
                "input": input_data
            }
            transfer_data = Transfer(request).Get_List_Transfer(value)  # Recibe el diccionario completo
            # transfer_data['transfer'] = sorted(
            #     transfer_data['transfer'],
            #     key=lambda x: (
            #         datetime.strptime(x['date_only'], "%Y-%m-%d") if x.get('date_only') else datetime.min,
            #         int(x['number']) if str(x.get('number', '')).isdigit() else 0
            #     ),
            #     reverse=True
            # )

            transfer_list = transfer_data.get('transfer', [])
            total_products = transfer_data.get('total_products', 0)

            data = [
                {
                    "id": p.get('id', ''),
                    "prefix": p.get('prefix', ''),
                    "transfer": f"{p.get('prefix', '')} - {p.get('number', '')}",
                    "number": f"{p.get('number', '')}",
                    "branch_receives__business_name": p.get('branch_receives__business_name', ''),
                    "branch_delivery__business_name": p.get('branch_delivery__business_name', ''),
                    "branch_delivery__id": int(p.get('branch_delivery__id', '')),
                    "status": p.get('status', ''),
                    "total": p.get('total', ''),
                    "date_only": p.get('date_only', ''),
                    "anulled": p.get('anulled', ''),
                    "accepted": p.get('accepted', ''),
                } for p in transfer_list
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


@require_POST
def Send_Transfer(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            data = json.loads(request.body.decode('utf-8'))
            print(data)
            _result = Transfer(request).Create_Transfer(data)
            return JsonResponse(_result)	
        return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        print(e, 'ERROR SEND DIAN')
        return JsonResponse({"error": str(e)}, status=500)


def Print_Transfer(request, transfer_id, type_document):
    data = Transfer(request).Get_Full_Transfer(transfer_id, type_document)
    data['transfer']['status'] = data['transfer']['status'].replace("Documento", "DOC.")
    subtotals = valtax = ico = discount = neto = 0.0
    details = data.get('details', [])
    print(data)

    for i in details:
        quantity = float(i.get('quantity', 0))
        price = float(i.get('price', 0))
        tax = float(i.get('tax', 0))
        ico_value = float(i.get('ico', 0))
        discount_rate = float(i.get('discount', 0))

        base_price = price - ico_value
        cost = base_price / (1 + tax / 100)
        _discount = discount_rate if discount_rate > 100 else cost * (discount_rate / 100)
        cost -= _discount
        total_cost = cost * (1 + tax / 100)
        _valtax = total_cost - cost

        i['cost'] = round(cost, 2)
        i['valtax'] = round(_valtax, 2)
        i['subtotal'] = round(cost * quantity, 2)
        i['discount'] = round(_discount, 2)

        neto += price * quantity
        subtotals += cost * quantity
        valtax += _valtax * quantity
        discount += _discount * quantity
        ico += ico_value * quantity

    totals = {
        "subtotals": round(subtotals, 2),
        "tax": round(valtax, 2),
        "ico": round(ico, 2),
        "discount": round(discount, 2),
        "totals": round(subtotals + valtax + ico, 2),
        "totals_with_discount": round(subtotals + valtax + ico, 2),
        "neto": round(neto, 2),
    }


    return render(request, 'transfer/ticket.html', {
        'transfer': data.get('transfer', {}),
        'details': details,
        'branch_receives': data.get('branch_receives', {}),
        'list_taxes': data.get('list_taxes', []),
        'totals': totals,
        'company': data.get('company', {}),
        'branch_delivery': data.get('branch_delivery', {}),
        'type_document': data.get('transfer', {}).get('type_document', type_document),
    })



def Get_List_Notifications(request):
	try:
		if request.headers.get('x-requested-with') == 'XMLHttpRequest':
			data = {
			    "branch_receives": request.session['branch_id']
			}
			_result = Transfer(request).Get_List_Notifications(data)
			return JsonResponse(_result)
		return JsonResponse({"error": "Método no permitido"}, status=405)
	except Exception as e:
		print(e, 'ERROR SEND DIAN')
		return JsonResponse({"error": str(e)}, status=500)

def Transfer_Accepted(request):
    try:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            data = json.loads(request.body.decode('utf-8'))
            print(data)
            _result = Transfer(request).Transfer_Accepted(data)
            return JsonResponse(_result)
        return JsonResponse({"error": "Método no permitido"}, status=405)
    except Exception as e:
        print(e, 'ERROR SEND DIAN')
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def Anulled_Transfer(request):
    try:
        if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
            data = json.loads(request.body.decode('utf-8'))
            print("Datos recibidos:", data)
            result = Transfer(request).Anulled_Transfer(data)
            return JsonResponse({
                "result": result["result"],
                "message": result["message"]
            })

        return JsonResponse({"error": "Método no permitido"}, status=405)

    except Exception as e:
        print("ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)








