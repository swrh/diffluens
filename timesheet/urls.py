from django.conf.urls import patterns, url

from timesheet import views

urlpatterns = patterns('',
    url(r'^$', views.home, name = 'home'),
    url(r'^events/create/$', views.events_create),
    url(r'^events/read/$', views.events_read),
    url(r'^events/update/$', views.events_update),
    url(r'^events/delete/$', views.events_delete),
    url(r'^events/move/$', views.events_move),
    url(r'^events/resize/$', views.events_resize),
    url(r'^report/$', views.report),
)

# vim:set et:
# vi:set sw=4 ts=4:
