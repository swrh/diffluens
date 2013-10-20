from django.db import models
from django.contrib.auth.models import User


class UserSettings(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    protheus_resource = models.CharField(max_length=16, null=True, blank=False)
    redmine_api_key = models.CharField(max_length=64, null=True, blank=False)


class Event(models.Model):
    issue = models.IntegerField()
    begin = models.DateTimeField()
    end = models.DateTimeField(null=True, blank=True)
    all_day = models.BooleanField()
    user = models.ForeignKey(User)
    read_only = models.BooleanField(default=False)

# vi:set sw=4 ts=4:
# vim:set et:
