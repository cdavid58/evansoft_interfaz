# home/middleware.py
import traceback
from django.http import JsonResponse
from django.conf import settings

class ExceptionHandlingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            # Ejecuta la vista normal
            response = self.get_response(request)
        except Exception as e:
            # Captura cualquier excepción y devuelve un mensaje de error JSON
            print("🚨 Excepción capturada:", traceback.format_exc())
            response = JsonResponse({
                'error': 'Ocurrió un error interno'
            }, status=500)

        return response
