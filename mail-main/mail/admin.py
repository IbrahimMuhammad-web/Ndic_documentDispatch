from django.contrib import admin

# Register your models here.
from .models import User, Email, DepartmentZoneUnit, ExternalMailsRecord
# Register your models here.

admin.site.register(User)
admin.site.register(Email)
admin.site.register(DepartmentZoneUnit)
admin.site.register(ExternalMailsRecord)