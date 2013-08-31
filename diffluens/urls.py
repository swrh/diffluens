from django.conf.urls import patterns, include, url
from django.contrib import admin

import timesheet.views

admin.autodiscover()

urlpatterns = patterns('',
    # url(r'^$', 'diffluens.views.home', name='home'),

    url(r'^admin/', include(admin.site.urls)),

    url(r'^api/v1/events/read/$', timesheet.views.events_read),
)
