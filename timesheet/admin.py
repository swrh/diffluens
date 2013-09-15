from django.contrib import admin
from timesheet.models import Event, UserSettings

admin.site.register(Event)
admin.site.register(UserSettings)
