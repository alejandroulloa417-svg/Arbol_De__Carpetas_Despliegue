from django.db import models

# Create your models here.

class Reporte(models.Model):
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField()
    # Cada tipo de archivo va a su subcarpeta dentro de media/
    foto = models.ImageField(upload_to='reportes/fotos/')
    documento = models.FileField(upload_to='reportes/documentos/', blank=True)
    audio = models.FileField(upload_to='reportes/audios/', blank=True)
    videos = models.FileField(upload_to='reportes/videos/', blank=True)
    fecha = models.DateTimeField(auto_now_add=True)
    

    def __str__(self):
        return self.nombre