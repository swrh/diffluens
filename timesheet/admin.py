from django.contrib import admin
from timesheet.models import Event, UserSettings, Settings

admin.site.register(Event)
admin.site.register(UserSettings)
admin.site.register(Settings)
