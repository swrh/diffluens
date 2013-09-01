import json
import time

from datetime import datetime

from django.http import HttpResponse
from django.core.exceptions import PermissionDenied

from timesheet.models import Event

def events_read(request):
    if not request.user.is_authenticated():
        raise PermissionDenied
    params = None
    if request.method == 'POST':
        params = request.POST
    elif request.method == 'GET':
        params = request.GET
    if params == None or params.get('start') == None or params.get('end') == None:
        raise PermissionDenied
    begin = datetime.fromtimestamp(int(params['start']))
    end = datetime.fromtimestamp(int(params['end']))
    evs = Event.objects.filter(user = request.user, begin__gte = begin, begin__lte = end)
    output = []
    for ev in evs:
        e = {}
        e['title'] = unicode(ev.issue)
        e['start'] = int(time.mktime(ev.begin.timetuple()))
        if ev.end != None:
            e['end'] = int(time.mktime(ev.end.timetuple()))
        e['allDay'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

# vim:set et:
# vi:set sw=4 ts=4:
