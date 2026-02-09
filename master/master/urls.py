from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from django.conf import settings
from django.shortcuts import render


# ==========
# Vistas personalizadas de error
# ==========

def custom_bad_request(request, exception):
    return render(request, "error.html", {"code": 400}, status=400)

def custom_permission_denied(request, exception):
    return render(request, "error.html", {"code": 403}, status=403)

def custom_page_not_found(request, exception):
    return render(request, "error.html", {"code": 404}, status=404)

def custom_server_error(request):
    return render(request, "error.html", {"code": 500}, status=500)


# ==========
# URLs
# ==========

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home.urls')),
    path('inventory/', include('inventory.urls')),
    path('invoice/', include('invoice.urls')),
    path('customer/', include('customer.urls')),
    path('supplier/', include('supplier.urls')),
    path('shopping/', include('shopping.urls')),
    path('setting/', include('setting.urls')),
    path('employee/', include('employee.urls')),
    path('wallet/', include('wallet.urls')),
    path('novelty/', include('novelty.urls')),
    path('quote/', include('quote.urls')),
    path('transfer/', include('transfer.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# ==========
# Handlers de errores
# ==========

handler400 = custom_bad_request
handler403 = custom_permission_denied
handler404 = custom_page_not_found
handler500 = custom_server_error
