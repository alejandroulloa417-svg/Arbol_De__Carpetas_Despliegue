from django.shortcuts import render, redirect
from .models import Reporte
from .forms import ReporteForm

def evacuacion(request):
    if request.method == 'POST':
        form = ReporteForm(request.POST, request.FILES)  # FILES = subidas
        if form.is_valid():
            form.save()
            return redirect('evacuacion')
    else:
        form = ReporteForm()

    reportes = Reporte.objects.all()
    return render(request, 'app_evacuacion_coderider/evacuacion.html', {
        'form': form,
        'reportes': reportes,
    })