import json

import dateutil.parser

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from timesheet.models import Event

@login_required
def home(request):
    return render_to_response('timesheet/index.html', dict(user = request.user))

@login_required
def events_read(request):
    params = request.POST
    if params == None or params.get('begin') == None or params.get('end') == None:
        raise PermissionDenied
    begin = dateutil.parser.parse(params['begin']).replace(tzinfo = None)
    end = dateutil.parser.parse(params['end']).replace(tzinfo = None)
    evs = Event.objects.filter(Q(begin__gte = begin, begin__lte = end) | Q(end__gte = begin, end__lte = end) | Q(begin__lte = begin, end__gte = end), user = request.user)
    output = []
    for ev in evs:
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end != None:
            e['end'] = ev.end.isoformat()
        e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_delete(request):
    params = request.POST
    if params == None or params.get('id') == None:
        raise PermissionDenied
    id = int(params['id'])
    evs = Event.objects.filter(id = id, user = request.user)
    output = []
    for ev in evs:
        e = {}
        e['id'] = ev.id
        ev.delete()
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

# vim:set et:
# vi:set sw=4 ts=4:
