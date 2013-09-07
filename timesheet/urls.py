from django.conf.urls import patterns, url

from timesheet import views

urlpatterns = patterns('',
    url(r'^events/read/$', views.events_read),
    url(r'^events/delete/$', views.events_delete),
)

# vim:set et:
# vi:set sw=4 ts=4:
