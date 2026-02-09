from django.shortcuts import render
from acttions import Novelty

def Create_Novelty(request):
	return render(request,'novelty/create.html')