import json
import time

from datetime import datetime

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from timesheet.models import Event

def home(request):
    if not request.user.is_authenticated():
        raise PermissionDenied
    return render_to_response('timesheet/index.html', dict(user = request.user))

def events_read(request):
    if not request.user.is_authenticated():
        raise PermissionDenied
    params = None
    if request.method == 'POST':
        params = request.POST
    elif request.method == 'GET':
        params = request.GET
    if params == None or params.get('begin') == None or params.get('end') == None:
        raise PermissionDenied
    begin = datetime.fromtimestamp(int(params['begin']))
    end = datetime.fromtimestamp(int(params['end']))
    evs = Event.objects.filter(Q(begin__gte = begin, begin__lte = end) | Q(end__gte = begin, end__lte = end) | Q(begin__lte = begin, end__gte = end), user = request.user)
    output = []
    for ev in evs:
        e = {}
        e['issue'] = ev.issue
        e['begin'] = int(time.mktime(ev.begin.timetuple()))
        if ev.end != None:
            e['end'] = int(time.mktime(ev.end.timetuple()))
        e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

def events_delete(request):
    if not request.user.is_authenticated():
        raise PermissionDenied
    params = None
    if request.method == 'POST':
        params = request.POST
    elif request.method == 'GET':
        params = request.GET
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
