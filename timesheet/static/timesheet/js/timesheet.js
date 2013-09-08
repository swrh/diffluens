$(document).ready(function() {
  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay',
    },
    editable: true,
    events: function(start, end, callback) {
      $.ajax({
        url: '/timesheet/events/read/',
        type: 'GET',
        contentType: 'application/json',
        dataType: 'json',
        data: {
          begin: Math.round(start.getTime() / 1000),
          end: Math.round(end.getTime() / 1000),
        },
        success: function(data) {
          for (var i in data) {
            var d = data[i];
            var e = {};
            e.allDay = d.all_day;
            e.start = d.begin;
            e.end = d.end;
            e.title = '' + d.issue;
            data[i] = e;
          }
          callback(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          alert('Failure while fetching events!');
        },
      });
    },
  });
});

// vim:set et:
// vi:set sw=2 ts=2:
