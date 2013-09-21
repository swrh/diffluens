/*
 * Date stuff.
 */
(function() {
  var numberToString = function(num, len) {
    var str = '0000' + num;
    return str.substr(str.length - len);
  }

  Date.prototype.toISO = function() {
    return numberToString(this.getFullYear(), 4) + '-' +
      numberToString(this.getMonth() + 1, 2) + '-' +
      numberToString(this.getDate(), 2) + 'T' +
      numberToString(this.getHours(), 2) + ':' +
      numberToString(this.getMinutes(), 2) + ':' +
      numberToString(this.getSeconds(), 2);
  }

  /*
   * For a given date, get the ISO week number
   *
   * Based on information at:
   *
   *    http://www.merlyn.demon.co.uk/weekcalc.htm#WNR
   *
   * Algorithm is to find nearest thursday, it's year
   * is the year of the week number. Then get weeks
   * between that date and the first day of that year.
   *
   * Note that dates in one year can be weeks of previous
   * or next year, overlap is up to 3 days.
   *
   * e.g. 2014/12/29 is Monday in week  1 of 2015
   *      2012/1/1   is Sunday in week 52 of 2011
   */
  Date.prototype.getWeekNumber = function() {
    // Copy date so don't modify original
    var d = new Date(this);
    d.setHours(0,0,0);
    // Set to nearest Thursday: current date + 4 - current day number
    // Make Sunday's day number 7
    d.setDate(d.getDate() + 4 - (d.getDay()||7));
    // Get first day of year
    var yearStart = new Date(d.getFullYear(),0,1);
    // Calculate full weeks to nearest Thursday
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
    // Return array of year and week number
    return [d.getFullYear(), weekNo];
  }
})();

/*
 * Array stuff.
 */
(function() {
  /*
   * Attach the .compare method to Array's prototype to call it on any array.
   */
  Array.prototype.compare = function(array) {
    // if the other array is a falsy value, return
    if (!array)
      return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
      return false;

    for (var i = 0; i < this.length; i++) {
      // Check if we have nested arrays
      if (this[i] instanceof Array && array[i] instanceof Array) {
        // recurse into the nested arrays
        if (!this[i].compare(array[i]))
          return false;
      }
      else if (this[i] != array[i]) {
        // Warning - two different object instances will never be equal: {x:20} != {x:20}
        return false;
      }
    }
    return true;
  }
})();

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
    axisFormat: 'HH:mm',
    timeFormat: {
      agenda: 'HH:mm{ - HH:mm}',
      '': 'HH:mm{ - HH:mm}',
    },
    slotMinutes: 15,
    events: function(start, end, callback) {
      $.ajax({
        url: '/timesheet/events/read/',
        type: 'POST',
        data: {
          begin: start.toISO(),
          end: end.toISO(),
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
    selectable: true,
    select: function(start, end, allDay) {
      $('#calendar').fullCalendar('unselect');
      if ($('#calendar').fullCalendar('getView')['name'].indexOf('agenda') != 0) {
        // Current view isn't agendaDay nor agendaWeek. Change the view according to the selection made.
        if ($('#calendar').fullCalendar('getDate').getMonth() != start.getMonth()) {
          // The user select a date of another month: switch to that month.
          $('#calendar').fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        } else if (start.getTime() == end.getTime()) {
          // The user selected just one date: switch to that date.
          $('#calendar').fullCalendar('changeView', 'agendaDay');
          $('#calendar').fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        } else if (start.getWeekNumber().compare(end.getWeekNumber())) {
          // The user selected more than one date in just one week: switch to
          // that week.
          $('#calendar').fullCalendar('changeView', 'agendaWeek');
          $('#calendar').fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        }
        return;
      }
    },
  });
});

// vim:set et:
// vi:set sw=2 ts=2:
