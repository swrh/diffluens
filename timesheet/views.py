import json
import csv

import dateutil.parser

from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from datetime import timedelta

from timesheet.models import Event

@login_required
def home(request):
    return render_to_response('timesheet/index.html', dict(user = request.user))

@login_required
def events_create(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    begin = params.get('begin')
    issue = params.get('issue')
    if begin is None or issue is None:
        raise PermissionDenied

    try:
        issue = int(issue)
    except ValueError:
        raise PermissionDenied

    begin = dateutil.parser.parse(begin).replace(tzinfo = None)

    end = params.get('end')
    if end is not None:
        end = dateutil.parser.parse(end).replace(tzinfo = None)

    all_day = params.get('all_day')
    if all_day is None:
        if end is not None:
            all_day = False
        else:
            all_day = True
    else:
        all_day = all_day.lower() == 'true'

    if not all_day and (end is None or begin > end):
        raise PermissionDenied

    event = Event(issue = issue, begin = begin, end = end, all_day = all_day, user = request.user)
    event.save()
    output = []
    for ev in ( event, ):
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end is not None:
            e['end'] = ev.end.isoformat()
        e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_read(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    begin = params.get('begin')
    end = params.get('end')
    if begin is None or end is None:
        raise PermissionDenied
    begin = dateutil.parser.parse(begin).replace(tzinfo = None)
    end = dateutil.parser.parse(end).replace(tzinfo = None)
    evs = Event.objects.filter(Q(begin__gte = begin, begin__lte = end) | Q(end__gte = begin, end__lte = end) | Q(begin__lte = begin, end__gte = end), user = request.user)
    output = []
    for ev in evs:
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end is not None:
            e['end'] = ev.end.isoformat()
        e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_update(request):
    params = request.POST
    id = params.get('id')
    if params is None or id is None:
        raise PermissionDenied

    try:
        id = int(id)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id = id, user = request.user)
    if len(evs) <= 0:
        raise PermissionDenied # FIXME

    issue = params.get('issue')
    if issue is not None:
        try:
            issue = int(params['issue'])
        except ValueError:
            raise PermissionDenied

    begin = params.get('begin')
    if begin is not None:
        begin = dateutil.parser.parse(begin).replace(tzinfo = None)

    end = params.get('end')
    if end is not None:
        end = dateutil.parser.parse(end).replace(tzinfo = None)

    all_day = params.get('all_day')
    if all_day is not None:
        all_day = all_day.lower() == 'true'

    # Update (memory only) and validate events parameters.
    for ev in evs:
        if issue is not None:
            ev.issue = issue
        if begin is not None:
            ev.begin = begin
        if end is not None:
            ev.end = end
        if all_day is not None:
            ev.all_day = all_day
        # Validate event.
        if ev.issue is None:
            raise PermissionDenied
        if ev.begin is None:
            raise PermissionDenied
        if not ev.all_day and ev.end is not None and ev.begin > ev.end:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end is not None:
            e['end'] = ev.end.isoformat()
        if ev.all_day is not None:
            e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_delete(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    id = params.get('id')
    if id is None:
        raise PermissionDenied
    id = int(id)
    evs = Event.objects.filter(id = id, user = request.user)
    output = []
    for ev in evs:
        e = {}
        e['id'] = ev.id
        ev.delete()
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_move(request):
    params = request.POST
    id = params.get('id')
    if params is None or id is None:
        raise PermissionDenied

    try:
        id = int(id)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id = id, user = request.user)
    if len(evs) <= 0:
        raise PermissionDenied # FIXME

    all_day = params.get('all_day')
    day_delta = params.get('day_delta')
    minute_delta = params.get('minute_delta')

    if day_delta is None and minute_delta is None:
        raise PermissionDenied

    try:
        if day_delta is not None and minute_delta is not None:
            delta = timedelta(days = int(day_delta), minutes = int(minute_delta))
        elif day_delta is not None:
            delta = timedelta(days = int(day_delta))
        elif minute_delta is not None:
            delta = timedelta(minutes = int(minute_delta))
    except ValueError:
        raise PermissionDenied

    all_day = params.get('all_day')
    if all_day is not None:
        all_day = all_day.lower() == 'true'

    # Update (memory only) and validate events parameters.
    for ev in evs:
        if ev.begin is not None:
            ev.begin += delta
        if ev.end is not None:
            ev.end += delta
        if all_day is not None:
            ev.all_day = all_day
        # Validate event.
        if ev.issue is None:
            raise PermissionDenied
        if ev.begin is None:
            raise PermissionDenied
        if not ev.all_day and ev.end is not None and ev.begin > ev.end:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end is not None:
            e['end'] = ev.end.isoformat()
        if ev.all_day is not None:
            e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def events_resize(request):
    params = request.POST
    id = params.get('id')
    if params is None or id is None:
        raise PermissionDenied

    try:
        id = int(id)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id = id, user = request.user)
    if len(evs) <= 0:
        raise PermissionDenied # FIXME

    day_delta = params.get('day_delta')
    minute_delta = params.get('minute_delta')

    if day_delta is None and minute_delta is None:
        raise PermissionDenied

    try:
        if day_delta is not None and minute_delta is not None:
            delta = timedelta(days = int(day_delta), minutes = int(minute_delta))
        elif day_delta is not None:
            delta = timedelta(days = int(day_delta))
        elif minute_delta is not None:
            delta = timedelta(minutes = int(minute_delta))
    except ValueError:
        raise PermissionDenied

    # Update (memory only) and validate events parameters.
    for ev in evs:
        if ev.end is not None:
            ev.end += delta
        # Validate event.
        if ev.issue is None:
            raise PermissionDenied
        if ev.begin is None:
            raise PermissionDenied
        if not ev.all_day and ev.end is not None and ev.begin > ev.end:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {}
        e['issue'] = ev.issue
        e['begin'] = ev.begin.isoformat()
        if ev.end is not None:
            e['end'] = ev.end.isoformat()
        if ev.all_day is not None:
            e['all_day'] = ev.all_day
        e['id'] = ev.id
        output.append(e)
    return HttpResponse(json.dumps(output), content_type = "application/json")

@login_required
def report(request):
    response = HttpResponse(content_type = 'text/plain')
    writer = csv.writer(response)
    for ev in Event.objects.all():
        writer.writerow([
            ev.begin.strftime('%Y%m%d'),
            ev.begin.strftime('%H:%M:%S'),
            ev.end.strftime('%H:%M:%S'),
            '',
            request.user.usersettings.protheus_resource,
            '',
            '#%d' % (ev.issue),
            ])
    return response

# vim:set et:
# vi:set sw=4 ts=4:
