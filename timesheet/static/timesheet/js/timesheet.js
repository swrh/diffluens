/*
 * CSRF stuff.
 */
(function() {
  getCookie = function(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
      var cookies = document.cookie.split(';');
      for (var i = 0; i < cookies.length; i++) {
        var cookie = jQuery.trim(cookies[i]);
        // Does this cookie string begin with the name we want?
        if (cookie.substring(0, name.length + 1) == (name + '=')) {
          cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
          break;
        }
      }
    }
    return cookieValue;
  }
  csrfSafeMethod = function(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  }
  var csrftoken = getCookie('csrftoken');
  $.ajaxSetup({
    crossDomain: false, // obviates need for sameOrigin test
    beforeSend: function(xhr, settings) {
      if (!csrfSafeMethod(settings.type)) {
        xhr.setRequestHeader("X-CSRFToken", csrftoken);
      }
    }
  });
})();

$(document).ready(function() {
  $('#dialog-alert').dialog({
    modal: true,
    dialogClass: 'no-close',
    autoOpen: false,
  });
  $('#dialog-alert').html('<p style="text-align: center;"></p>');

  /*
   * Initialize FullCalendar.
   */
  $('#calendar').fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay',
    },
    theme: true,
    editable: true,
    events: function(start, end, callback) {
      $.ajax({
        url: '/timesheet/events/read/',
        type: 'POST',
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
          $('#dialog-alert').dialog('option', 'title', 'Error');
          $('#dialog-alert p').text('Failure while fetching events!');
          $('#dialog-alert').dialog('open');
        },
      });
    },
  });
});

// vim:set et:
// vi:set sw=2 ts=2:
