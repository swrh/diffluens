from django.db import models
from django.contrib.auth.models import User

class Event(models.Model):
    issue = models.IntegerField()
    begin = models.DateTimeField()
    end = models.DateTimeField(null = True, blank = True)
    all_day = models.BooleanField()
    user = models.ForeignKey(User)

# vi:set sw=4 ts=4:
# vim:set et:
