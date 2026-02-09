from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_POST
from django.views.decorators.csrf import csrf_exempt
from inventory.decorators import session_required
from django.http import HttpResponse,JsonResponse
from datetime import datetime
from acttions import Wallet
import traceback
import json

@csrf_exempt
@session_required
def Create_Pass_Invoice(request):
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            data = json.loads(request.body)
            required_fields = ['payment_pass', 'branch_id', 'accounts_receivable']
            for field in required_fields:
                if field not in data:
                    return JsonResponse({'result': False, 'message': f"El campo '{field}' es obligatorio."})
            print(data)
            result = Wallet(request).Create_Pass_Invoice(data)
            print(result)
            return JsonResponse(result)
        except json.JSONDecodeError:
            return JsonResponse({'result': False, 'message': 'Datos JSON inválidos.'})
        except Exception as e:
            return JsonResponse({'result': False, 'message': str(e)})

    return JsonResponse({'result': False, 'message': 'Petición no permitida.'})
