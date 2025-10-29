# invoice/templatetags/format_filters.py
from django import template

register = template.Library()

@register.filter
def miles(numero):
    try:
        numero = round(float(numero))
        return "{:,}".format(numero).replace(",", ".")
    except:
        return numero
