from django.shortcuts import redirect
from functools import wraps

def session_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.session.get('company_id') or not request.session.get('branch_id'):
            return redirect('Logins')
        return view_func(request, *args, **kwargs)
    return _wrapped_view
