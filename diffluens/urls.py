from django.conf.urls import patterns, include, url
from django.contrib import admin

admin.autodiscover()

urlpatterns = patterns('',
    url(r'^admin/', include(admin.site.urls)),

    url(r'^timesheet/', include('timesheet.urls', namespace = 'timesheet')),
    url(r'^accounts/login/$', 'django.contrib.auth.views.login'),
)

# vim:set et:
# vi:set sw=4 ts=4:
