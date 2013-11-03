import json
import re
import unicodedata

import dateutil.parser

from django.core.cache import cache
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.core.exceptions import PermissionDenied
from django.db.models import Q

from datetime import timedelta

from redmine import Redmine

from timesheet.models import Event, UserSettings, Settings


class RedmineIssuesCache:
    def __init__(self, user):
        self._redmine = None
        self._user = user
        self._cache_key = 'redmine-issues-%u' % self._user.id
        self._issues = cache.get(self._cache_key, {})

    def clear(self):
        self._issues = {}

    def get_redmine(self):
        if self._redmine is None:
            redmine_url = Settings.objects.all()
            if redmine_url is None or len(redmine_url) <= 0:
                raise PermissionDenied
            redmine_url = redmine_url[0].redmine_url
            redmine_api_key = UserSettings.objects.filter(user=self._user)
            if redmine_api_key is None or len(redmine_api_key) <= 0:
                raise PermissionDenied
            redmine_api_key = redmine_api_key[0].redmine_api_key
            self._redmine = Redmine(redmine_url, key=redmine_api_key)
        return self._redmine

    def get_issue(self, id_):
        if self._issues.get(id_, None) is None:
            r = self.get_redmine()
            try:
                issue = r.issues[id_]
                if hasattr(issue, 'parent'):
                    issue.parent.refresh()
                    parent = issue.parent.id
                else:
                    parent = None
                data = {
                    'subject': issue.subject,
                    'project': issue.project.name,
                    'parent': parent,
                    'valid': True,
                }
            except KeyError:
                data = {
                    'valid': False,
                }
            self._issues[id_] = data
            cache_expires = Settings.objects.all()
            if cache_expires is None or len(cache_expires) <= 0:
                raise PermissionDenied
            cache_expires = cache_expires[0].cache_expires
            cache.set(self._cache_key, self._issues, cache_expires)
        return self._issues[id_]


class RedmineProtheusMapping:
    def __init__(self, issues_cache):
        self._issues_cache = issues_cache
        self._searches = {
            'project': re.compile(r'\[P:([0-9.]+)]'),
            'issue': re.compile(r'\[T:([0-9.]+)]'),
        }

    def get_protheus(self, issue, entry):
        i = self._issues_cache.get_issue(issue)
        if not i['valid']:
            return None
        s = self._searches[entry].search(i['subject'])
        if not s:
            if 'parent' not in i.keys():
                return None
            return self.get_protheus(i['parent'], entry)
        return s.group(1)


@login_required
def home(request):
    return render_to_response('timesheet/index.html', dict(user=request.user))


@login_required
def events_create(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    issue = params.get('issue')
    begin = params.get('begin')
    end = params.get('end')
    if issue is None or begin is None or end is None:
        raise PermissionDenied

    try:
        issue = int(issue)
    except ValueError:
        raise PermissionDenied

    begin = dateutil.parser.parse(begin).replace(tzinfo=None)
    end = dateutil.parser.parse(end).replace(tzinfo=None)
    if begin > end:
        raise PermissionDenied

    event = Event(issue=issue, begin=begin, end=end, user=request.user)
    event.save()
    output = []
    for ev in (event,):
        e = {
            'issue': ev.issue,
            'begin': ev.begin.isoformat(),
            'end': ev.end.isoformat(),
            'id': ev.id,
            'read_only': ev.read_only,
        }
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def events_read(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    begin = params.get('begin')
    end = params.get('end')
    if begin is None or end is None:
        raise PermissionDenied
    begin = dateutil.parser.parse(begin).replace(tzinfo=None)
    end = dateutil.parser.parse(end).replace(tzinfo=None)
    evs = Event.objects.filter(Q(begin__gte=begin, begin__lte=end) |
                               Q(end__gte=begin, end__lte=end) |
                               Q(begin__lte=begin, end__gte=end), user=request.user)
    output = []
    for ev in evs:
        e = {
            'issue': ev.issue,
            'begin': ev.begin.isoformat(),
            'end': ev.end.isoformat(),
            'id': ev.id,
            'read_only': ev.read_only,
        }
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def events_update(request):
    params = request.POST
    id_ = params.get('id')
    if params is None or id_ is None:
        raise PermissionDenied

    try:
        id_ = int(id_)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id=id_, user=request.user)
    if len(evs) <= 0:
        raise PermissionDenied  # FIXME

    issue = params.get('issue')
    if issue is not None:
        try:
            issue = int(issue)
        except ValueError:
            raise PermissionDenied

    begin = params.get('begin')
    if begin is not None:
        begin = dateutil.parser.parse(begin).replace(tzinfo=None)

    end = params.get('end')
    if end is not None:
        end = dateutil.parser.parse(end).replace(tzinfo=None)

    if begin is None and end is None:
        raise PermissionDenied

    # Update (memory only) and validate events parameters.
    for ev in evs:
        if issue is not None:
            ev.issue = issue
        if begin is not None:
            ev.begin = begin
        if end is not None:
            ev.end = end
        # Validate event.
        if ev.issue is None:
            raise PermissionDenied
        if ev.begin is None:
            raise PermissionDenied
        if ev.end is None:
            raise PermissionDenied
        if ev.begin > ev.end:
            raise PermissionDenied
        if ev.read_only:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {
            'issue': ev.issue,
            'begin': ev.begin.isoformat(),
            'end': ev.end.isoformat(),
            'id': ev.id,
            'read_only': ev.read_only,
        }
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def events_delete(request):
    params = request.POST
    if params is None:
        raise PermissionDenied
    id_ = params.get('id')
    if id_ is None:
        raise PermissionDenied
    id_ = int(id_)
    evs = Event.objects.filter(id=id_, user=request.user)
    for ev in evs:
        if ev.read_only:
            raise PermissionDenied
    output = []
    for ev in evs:
        e = {
            'id': ev.id,
        }
        ev.delete()
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def events_move(request):
    params = request.POST
    id_ = params.get('id')
    if params is None or id_ is None:
        raise PermissionDenied

    try:
        id_ = int(id_)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id=id_, user=request.user)
    if len(evs) <= 0:
        raise PermissionDenied  # FIXME

    day_delta = params.get('day_delta')
    minute_delta = params.get('minute_delta')

    if day_delta is None and minute_delta is None:
        raise PermissionDenied

    try:
        if day_delta is not None and minute_delta is not None:
            delta = timedelta(days=int(day_delta), minutes=int(minute_delta))
        elif day_delta is not None:
            delta = timedelta(days=int(day_delta))
        elif minute_delta is not None:
            delta = timedelta(minutes=int(minute_delta))
    except ValueError:
        raise PermissionDenied

    # Update (memory only) and validate events parameters.
    for ev in evs:
        if ev.begin is not None:
            ev.begin += delta
        if ev.end is not None:
            ev.end += delta
        # Validate event.
        if ev.issue is None:
            raise PermissionDenied
        if ev.begin is None:
            raise PermissionDenied
        if ev.end is None:
            raise PermissionDenied
        if ev.begin > ev.end:
            raise PermissionDenied
        if ev.read_only:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {
            'issue': ev.issue,
            'begin': ev.begin.isoformat(),
            'end': ev.end.isoformat(),
            'id': ev.id,
            'read_only': ev.read_only,
        }
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def events_resize(request):
    params = request.POST
    id_ = params.get('id')
    if params is None or id_ is None:
        raise PermissionDenied

    try:
        id_ = int(id_)
    except ValueError:
        raise PermissionDenied

    evs = Event.objects.filter(id=id_, user=request.user)
    if len(evs) <= 0:
        raise PermissionDenied  # FIXME

    day_delta = params.get('day_delta')
    minute_delta = params.get('minute_delta')

    if day_delta is None and minute_delta is None:
        raise PermissionDenied

    try:
        if day_delta is not None and minute_delta is not None:
            delta = timedelta(days=int(day_delta), minutes=int(minute_delta))
        elif day_delta is not None:
            delta = timedelta(days=int(day_delta))
        elif minute_delta is not None:
            delta = timedelta(minutes=int(minute_delta))
        else:
            # FIXME
            # The following statement has been inserted just to avoid an "uninitialized variable" warning in PyCharm
            # referring to the `delta' variable.
            raise PermissionDenied
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
        if ev.end is None:
            raise PermissionDenied
        if ev.begin > ev.end:
            raise PermissionDenied
        if ev.read_only:
            raise PermissionDenied

    # Commit and prepare events to be returned.
    output = []
    for ev in evs:
        ev.save()
        e = {
            'issue': ev.issue,
            'begin': ev.begin.isoformat(),
            'end': ev.end.isoformat(),
            'id': ev.id,
            'read_only': ev.read_only,
        }
        output.append(e)
    return HttpResponse(json.dumps(output), content_type="application/json")


@login_required
def redmine_issues_assigned(request):
    params = request.POST
    if params is None:
        raise PermissionDenied

    cache_key = 'redmine-issues-assigned-%u' % request.user.id
    assigned_issue_ids = cache.get(cache_key)
    if assigned_issue_ids is None:
        redmine_url = Settings.objects.all()
        if redmine_url is None or len(redmine_url) <= 0:
            raise PermissionDenied
        redmine_url = redmine_url[0].redmine_url
        redmine_api_key = UserSettings.objects.filter(user=request.user)
        if redmine_api_key is None or len(redmine_api_key) <= 0:
            raise PermissionDenied
        redmine_api_key = redmine_api_key[0].redmine_api_key
        redmine = Redmine(redmine_url, key=redmine_api_key)
        assigned_issue_ids = [i.id for i in redmine.issues(assigned_to_id=redmine.user.id)]
        cache_expires = Settings.objects.all()
        if cache_expires is None or len(cache_expires) <= 0:
            raise PermissionDenied
        cache_expires = cache_expires[0].cache_expires
        cache.set(cache_key, assigned_issue_ids, cache_expires)

    issues_cache = RedmineIssuesCache(request.user)

    output = {}
    for id_ in assigned_issue_ids:
        issue = issues_cache.get_issue(id_)
        if issue['valid']:
            output[id_] = issue

    return HttpResponse(json.dumps(output), content_type='application/json')


@login_required
def redmine_issues_read(request):
    params = request.POST
    ids = params.getlist('ids[]')
    if params is None or ids is None:
        raise PermissionDenied

    # Remove duplicated ids.
    ids = list(set(ids))

    issues_cache = RedmineIssuesCache(request.user)

    output = {}
    for id_ in ids:
        issue = issues_cache.get_issue(id_)
        if issue['valid']:
            output[id_] = issue

    return HttpResponse(json.dumps(output), content_type='application/json')


@login_required
def report(request):
    issues_cache = RedmineIssuesCache(request.user)
    mapper = RedmineProtheusMapping(issues_cache)
    issues_cache.clear()
    evs = Event.objects.filter(read_only=False, user=request.user)
    verified_events = []
    verified_issues = []
    errors = []
    for ev in evs:
        verified_events.append(ev.id)
        evs_conflict = Event.objects.filter(Q(begin__gte=ev.begin, begin__lt=ev.end) |
                                            Q(end__gt=ev.begin, end__lte=ev.end) |
                                            Q(begin__lte=ev.begin, end__gte=ev.end),
                                            ~Q(id__in=verified_events),
                                            user=request.user)
        for evc in evs_conflict:
            errors.append('Event %d (#%d, %s-%s) conflicts with event %d (#%d, %s-%s)' % (
                ev.id, ev.issue, ev.begin.isoformat(), ev.end.isoformat(),
                evc.id, evc.issue, evc.begin.isoformat(), evc.end.isoformat()))
        issue = issues_cache.get_issue(ev.issue)
        if not issue['valid']:
            errors.append('Event %d (%s-%s) points to invalid issue #%d' % (
                ev.id, ev.begin.isoformat(), ev.end.isoformat(), ev.issue))
        elif ev.issue not in verified_issues:
            if not mapper.get_protheus(ev.issue, 'project'):
                errors.append('Redmine issue #%d has no Protheus project associated with it' % ev.issue)
            if not mapper.get_protheus(ev.issue, 'issue'):
                errors.append('Redmine issue #%d has no Protheus issue associated with it' % ev.issue)
        if ev.issue not in verified_issues:
            verified_issues.append(ev.issue)
    if len(errors) > 0:
        return HttpResponse('\n'.join(errors), content_type='text/plain')
    output = []
    for ev in evs:
        issue = issues_cache.get_issue(ev.issue)
        if issue['valid']:
            description = '%s (#%d)' % (unicodedata.normalize('NFKD', issue['subject']).encode('ascii', 'ignore'), ev.issue)
        else:
            description = '#%d' % ev.issue
        output.append(' %-15s %-15s %-15s %-15s %-15s %-30s %s' % (
            ev.begin.strftime('%Y%m%d'),
            ev.begin.strftime('%H:%M:%S'),
            ev.end.strftime('%H:%M:%S'),
            mapper.get_protheus(ev.issue, 'project'),
            request.user.usersettings.protheus_resource,
            mapper.get_protheus(ev.issue, 'issue'),
            description,
        ))
    return HttpResponse('\n'.join(output), content_type='text/plain')

# vim:set et:
# vi:set sw=4 ts=4:
