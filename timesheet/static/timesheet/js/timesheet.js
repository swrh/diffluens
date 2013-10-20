/*
 * CRC32
 */
(function() {
  var generateCRC32Table = function() {
    var c;
    var table = [];
    for (var n = 0; n < 256; n++) {
      c = n;
      for (var k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[n] = c;
    }
    return table;
  };

  var crc32_table = generateCRC32Table();

  crc32 = function(str, crc) {
    crc = crc || -1;
    for (var i = 0, len = str.length; i < len; i++) {
      crc = (crc >>> 8) ^ crc32_table[ (crc ^ str.charCodeAt(i)) & 0xff ];
    }

    return crc ^ -1;
  };
})();

/*
 * Date stuff.
 */
(function() {
  moment.fn.format_notz = function() {
    return this.format('YYYY-MM-DDTHH:mm:ss');
  }
})();

/*
 * CSRF stuff.
 */
(function() {
  var getCookie = function(name) {
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
  };
  var csrfSafeMethod = function(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
  };
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

/*
 * An stupid way to generate different colors.
 */
(function($) {
  var luminance = function(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  };

  colorize = function(number) {
    var crc = crc32('' + number);

    /* Put the colors between 32 and 223. */
    var r = (crc >> 16) & 0xff;
    var g = (crc >>  8) & 0xff;
    var b = (crc      ) & 0xff;

    var l = luminance(r, g, b);

    var f;
    if (l < .15) {
      f = .15 / l;
    } else if (l > .55) {
      f = .55 / l;
    } else {
      f = 1;
    }

    r = ('00' + (~~(f * r * 255)).toString(16)).slice(-2);
    g = ('00' + (~~(f * g * 255)).toString(16)).slice(-2);
    b = ('00' + (~~(f * b * 255)).toString(16)).slice(-2);

    return '#' + r + g + b;
  };
})();

/*
 * dialogIssue plugin.
 */
(function($) {
  var defaults = {
  };

  $.fn.dialogIssue = function(options) {
    if (typeof(options) == 'string') {
      var args = Array.prototype.slice.call(arguments, 1);
      var res;
      this.each(function() {
        var de = $.data(this, 'dialogIssue');
        if (de && $.isFunction(de[options])) {
          var r = de[options].apply(de, args);
          if (res === undefined) {
            res = r;
          }
          if (options == 'destroy') {
            $.removeData(this, 'dialogIssue');
          }
        }
      });
      if (res !== undefined) {
        return res;
      }
      return this;
    }

    options = options || {};

    options = $.extend(defaults, options);

    this.each(function(i, _element) {
      var element = $(_element);
      var de = new DialogIssue(element, options);
      element.data('dialogIssue', de);
    });

    return this;
  };

  var DialogIssue = function(element, options) {
    var this_ = this;

    this.element = element;
    this.options = options;

    element.html(
      '<form>\n' +
        '<label class="label-block" for="date">Date</label>\n' +
        '<input id="date" class="text ui-corner-all ui-widget-content input-block" type="text" disabled="true" />\n' +
        '<label><input name="allday" id="allday" type="checkbox" disabled="true" /> All day</label>\n' +
        '<div class="issue-time">\n' +
        '<div class="issue-time-begin">\n' +
        '<label class="label-block" for="begin">Begin</label>\n' +
        '<input id="begin" class="text ui-corner-all ui-widget-content input-block" type="text" disabled="true" />\n' +
        '</div>\n' +
        '<div class="issue-time-end">\n' +
        '<label class="label-block" for="end">End</label>\n' +
        '<input id="end" class="text ui-corner-all ui-widget-content input-block" type="text" disabled="true" />\n' +
        '</div>\n' +
        '</div>\n' +
        '<label class="label-block" for="issue">Issue</label>\n' +
        '<input id="issue" class="text ui-corner-all ui-widget-content input-block" type="text" autofocus />\n' +
        '</form>');
    element.dialog({
      minWidth: 300,
      autoOpen: false,
      modal: true,
      buttons: {
        'OK': function() {
          this_.save();
        },
        'Delete': function() {
          this_.delete();
        },
        'Cancel': function() {
          this_.cancel();
        },
      },
    });
  };

  DialogIssue.prototype.open = function(options) {
    this.onClickOk = options.onClickOk;
    if (this.onClickOk == null) {
      this.element.parent().find(':button:contains("OK")').prop('disabled', true).addClass('ui-state-disabled');
    } else {
      this.element.parent().find(':button:contains("OK")').prop('disabled', false).removeClass('ui-state-disabled');
    }
    this.onClickDelete = options.onClickDelete;
    if (this.onClickDelete == null) {
      this.element.parent().find(':button:contains("Delete")').prop('disabled', true).addClass('ui-state-disabled');
    } else {
      this.element.parent().find(':button:contains("Delete")').prop('disabled', false).removeClass('ui-state-disabled');
    }

    this.event = options.event;

    this.element.find('.tip').text('').removeClass('ui-state-highlight');
    this.element.find('.text').val('').removeClass('ui-state-error');

    var begin = moment(this.event.begin);

    this.element.find('#date').val(begin.format('DD/MM/YYYY'));
    if (this.event.all_day) {
      this.element.find('.issue-time').hide();
      this.element.find('#allday').prop('checked', true);
    } else {
      this.element.find('.issue-time').show();
      this.element.find('#allday').prop('checked', false);
      this.element.find('#begin.text').val(begin.format('HH:mm'));
      this.element.find('#end.text').val(moment(this.event.end).format('HH:mm'));
    }
    this.element.find('#issue.text').val(this.event.issue);

    this.element.dialog('open');
  };

  DialogIssue.prototype.save = function() {
    this.element.find('.tip').text('').removeClass('ui-state-highlight');
    this.element.find('.text').removeClass('ui-state-error');

    var issue = this.element.find('#issue.text').val().trim();
    if (issue.length <= 0) {
      this.element.find('#issue.text').addClass('ui-state-error');
      this.element.find('#issue.tip').text('Issue must not be empty.').addClass('ui-state-highlight');
      return;
    }

    this.event.issue = issue;

    if (this.onClickOk != null) {
      this.onClickOk(this.event);
    } else {
      this.close();
    }
  };

  DialogIssue.prototype.delete = function() {
    if (this.onClickDelete != null) {
      this.onClickDelete(this.event);
    } else {
      this.close();
    }
  };

  DialogIssue.prototype.cancel = function() {
    this.close();
  };

  DialogIssue.prototype.close = function() {
    this.element.dialog('close');
  };
})(jQuery);

/*
 * dialogAlert plugin.
 */
(function($) {
  var defaults = {
  };

  $.fn.dialogAlert = function(options) {
    if (typeof(options) == 'string') {
      var args = Array.prototype.slice.call(arguments, 1);
      var res;
      this.each(function() {
        var de = $.data(this, 'dialogAlert');
        if (de && $.isFunction(de[options])) {
          var r = de[options].apply(de, args);
          if (res === undefined) {
            res = r;
          }
          if (options == 'destroy') {
            $.removeData(this, 'dialogAlert');
          }
        }
      });
      if (res !== undefined) {
        return res;
      }
      return this;
    }

    options = options || {};

    options = $.extend(defaults, options);

    this.each(function(i, _element) {
      var element = $(_element);
      var de = new DialogAlert(element, options);
      element.data('dialogAlert', de);
    });

    return this;
  };

  var DialogAlert = function(element, options) {
    this.element = element;
    this.options = options;

    element.html('<p style="text-align: center;"></p>');
    element.dialog({
      modal: true,
      autoOpen: false,
    });
  };

  DialogAlert.prototype.status = function(message) {
    this.element.parent().find('.ui-dialog-titlebar :button').hide();
    this.element.dialog('option', 'closeOnEscape', false);
    this.element.dialog('option', 'title', 'Status');
    this.element.find('p').text(message);
    this.element.dialog('open');
  };

  DialogAlert.prototype.error = function(message) {
    this.element.parent().find('.ui-dialog-titlebar :button').show();
    this.element.dialog('option', 'closeOnEscape', true);
    this.element.dialog('option', 'title', 'Error');
    this.element.find('p').text(message);
    this.element.dialog('open');
  };

  DialogAlert.prototype.close = function() {
    this.element.dialog('close');
  };
})(jQuery);

/*
 * Miscellaneous.
 */
(function($) {
  htmlize = function(str) {
    return $('<div />').text(str).html();
  };
})(jQuery);

/*
 * Diffluens + FullCalendar integration stuff.
 */
(function() {
  jsonD2F = function(d, f) {
    f = f || {};
    f.id = d.id;
    f.allDay = d.all_day;
    f.start = moment(d.begin).toDate();
    f.end = moment(d.end).toDate();
    f.title = '' + d.issue;
    f.color = colorize(d.issue);
    return f;
  };
  jsonF2D = function(f, d) {
    d = d || {};
    d.id = f.id;
    d.all_day = f.allDay;
    d.begin = moment(f.start).format_notz();
    d.end = moment(f.end).format_notz();
    d.issue = parseInt(f.title);
    return d;
  };
})();

/*
 * Initialization stuff.
 */
$(document).ready(function() {
  $('#dialog-alert').dialogAlert();
  $('#dialog-issue').dialogIssue();

  /*
   * Initialize FullCalendar.
   */
  var calendar = $('#calendar');
  calendar.fullCalendar({
    header: {
      left: 'prev,next today',
      center: 'title',
      right: 'month,agendaWeek,agendaDay',
    },
    theme: true,
    editable: true,
    droppable: true,
    axisFormat: 'HH:mm',
    timeFormat: {
      agenda: 'HH:mm{ - HH:mm}',
      '': 'HH:mm{ - HH:mm}',
    },
    slotMinutes: 15,
    defaultView: 'agendaWeek',
    events: function(start, end, callback) {
      $.ajax({
        url: '/timesheet/events/read/',
        type: 'POST',
        data: {
          begin: moment(start).format_notz(),
          end: moment(end).format_notz(),
        },
        success: function(data) {
          var ids = [];
          for (var i = 0; i < data.length; i++) {
            ids[i] = data[i].issue;
          }
          $.ajax({
            url: '/timesheet/redmine/issues/read/',
            type: 'POST',
            data: {
              ids: ids,
            },
            success: function(issueData) {
              for (var i = 0; i < data.length; i++) {
                var issue = issueData[data[i].issue];
                var d = jsonD2F(data[i]);
                d.valid = false;
                if (issue) {
                  d.subject = issue.subject;
                  d.project = issue.project;
                  d.valid = true;
                }
                data[i] = d;
              }
              callback(data);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              for (var i = 0; i < data.length; i++) {
                data[i] = jsonD2F(data[i]);
              }
              callback(data);
            },
          });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $('#dialog-alert').dialogAlert('error', 'Failure while fetching events!');
        },
      });
    },
    selectable: true,
    selectHelper: true,
    select: function(start, end, allDay) {
      calendar.fullCalendar('unselect');
      if (calendar.fullCalendar('getView')['name'].indexOf('agenda') != 0) {
        // Current view isn't agendaDay nor agendaWeek. Change the view according to the selection made.
        if (calendar.fullCalendar('getDate').getMonth() != start.getMonth()) {
          // The user select a date of another month: switch to that month.
          calendar.fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        } else if (start.getTime() == end.getTime()) {
          // The user selected just one date: switch to that date.
          calendar.fullCalendar('changeView', 'agendaDay');
          calendar.fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        } else if (moment(start).week() == moment(end).week()) {
          // The user selected more than one date in just one week: switch to
          // that week.
          calendar.fullCalendar('changeView', 'agendaWeek');
          calendar.fullCalendar('gotoDate', start.getFullYear(), start.getMonth(), start.getDate());
        }
        return;
      }
      $('#dialog-issue').dialogIssue('open', {
        event: {
          begin: start,
          end: end,
          all_day: allDay,
        },
        onClickOk: function(event) {
          $('#dialog-alert').dialogAlert('status', 'Please wait...');

          $.ajax({
            url: '/timesheet/events/create/',
            type: 'POST',
            data: {
              issue: event.issue,
              begin: moment(event.begin).format_notz(),
              end: moment(event.end).format_notz(),
              all_day: event.all_day,
            },
            success: function(data) {
              $('#dialog-issue').dialogIssue('close');
              for (var i = 0; i < data.length; i++) {
                calendar.fullCalendar('renderEvent', jsonD2F(data[i]));
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              $('#dialog-alert').dialogAlert('error', 'Failure while creating event!');
            },
          });
        },
      });
    },
    eventClick: function(event, jsEvent, view) {
      var fc_event = event;
      $('#dialog-issue').dialogIssue('open', {
        event: {
          id: event.id,
          issue: parseInt(event.title),
          begin: event.start,
          end: event.end,
          all_day: event.allDay,
        },
        onClickOk: function(event) {
          $('#dialog-alert').dialogAlert('status', 'Please wait...');

          $.ajax({
            url: '/timesheet/events/update/',
            type: 'POST',
            data: {
              id: event.id,
              issue: event.issue,
              begin: moment(event.begin).format_notz(),
              end: event.end == null ? undefined : moment(event.end).format_notz(),
              all_day: event.all_day,
            },
            success: function(data) {
              $('#dialog-issue').dialogIssue('close');
              if (data.length != 1) {
                // Here we must delete all events by their ids first and then add
                // all received events back again. We MUST NOT do in the same
                // loop for almost obvious reasons I don't want to explain now.
                for (var i = 0; i < data.length; i++) {
                  calendar.fullCalendar('removeEvents', data[i].id);
                }
                for (var i = 0; i < data.length; i++) {
                  calendar.fullCalendar('renderEvent', jsonD2F(data[i]));
                }
              } else {
                jsonD2F(data[0], fc_event);
                calendar.fullCalendar('updateEvent', fc_event);
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              $('#dialog-alert').dialogAlert('error', 'Failure while updating event!');
            },
          });
        },
        onClickDelete: function(event) {
          $('#dialog-alert').dialogAlert('status', 'Please wait...');

          $.ajax({
            url: '/timesheet/events/delete/',
            type: 'POST',
            data: {
              id: event.id,
            },
            success: function(data) {
              $('#dialog-issue').dialogIssue('close');
              for (var i = 0; i < data.length; i++) {
                calendar.fullCalendar('removeEvents', data[i].id);
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              $('#dialog-alert').dialogAlert('error', 'Failure while deleting event!');
            },
          });
        },
      });
    },
    eventDrop: function(event, dayDelta, minuteDelta, allDay, revertFunc) {
      $('#dialog-alert').dialogAlert('status', 'Please wait...');

      $.ajax({
        url: '/timesheet/events/move/',
        type: 'POST',
        data: {
          id: event['id'],
          day_delta: dayDelta,
          minute_delta: minuteDelta,
          all_day: allDay,
        },
        success: function(data) {
          if (data.length != 1) {
            // Here we must delete all events by their ids first and then add
            // all received events back again. We MUST NOT do in the same
            // loop for almost obvious reasons I don't want to explain now.
            for (var i = 0; i < data.length; i++) {
              calendar.fullCalendar('removeEvents', data[i].id);
            }
            for (var i = 0; i < data.length; i++) {
              calendar.fullCalendar('renderEvent', jsonD2F(data[i]));
            }
          } else {
            jsonD2F(data[0], event);
            calendar.fullCalendar('updateEvent', event);
          }
          $('#dialog-alert').dialogAlert('close');
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          revertFunc();
          $('#dialog-alert').dialogAlert('error', 'Failure while moving event!');
        },
      });
    },
    eventResize: function(event, dayDelta, minuteDelta, revertFunc) {
      $('#dialog-alert').dialogAlert('status', 'Please wait...');

      $.ajax({
        url: '/timesheet/events/resize/',
        type: 'POST',
        data: {
          id: event['id'],
          day_delta: dayDelta,
          minute_delta: minuteDelta,
        },
        success: function(data) {
          if (data.length != 1) {
            // Here we must delete all events by their ids first and then add
            // all received events back again. We MUST NOT do in the same
            // loop for almost obvious reasons I don't want to explain now.
            for (var i = 0; i < data.length; i++) {
              calendar.fullCalendar('removeEvents', data[i].id);
            }
            for (var i = 0; i < data.length; i++) {
              calendar.fullCalendar('renderEvent', jsonD2F(data[i]));
            }
          } else {
            jsonD2F(data[0], event);
            calendar.fullCalendar('updateEvent', event);
          }
          $('#dialog-alert').dialogAlert('close');
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          revertFunc();
          $('#dialog-alert').dialogAlert('error', 'Failure while moving event!');
        },
      });
    },
    eventRender: function(event, element) {
      var subject = '';
      if (event.valid) {
        subject = '';
        if (event.project) {
          subject += ' [' + event.project + ']';
        }
        if (event.subject) {
          subject += ' ' + event.subject;
        }
      }
      // Tooltip
      element.attr('title', '#' + event.title + subject);
      var time = element.find('.fc-event-time');
      var title = element.find('.fc-event-title');
      var hours = Math.round((event.end - event.start) / 1000 / 60 / 60 * 100) / 100;
      time.html(moment(event.start).format('HH:mm') + ' +' + hours);
      title.html($('<div />').text('#' + event.title).html());
      var basicView = calendar.fullCalendar('getView')['name'].indexOf('agenda') != 0;
      if (!basicView && event.valid) {
        subject = '<br /><div>';
        if (event.project) {
          subject += '<b><i>' + $('<div />').text(event.project).html() + '</i></b>';
          if (event.subject) {
            subject += '<br />';
          }
        }
        if (event.subject) {
          subject += $('<div />').text(event.subject).html();
        }
        subject += '</div>';
        title.parent().append(subject);
      }
    },
    drop: function(date, allDay) { // this function is called when something is dropped
      // retrieve the dropped element's stored Event Object
      var issue = $(this).data('eventObject').title.replace( / .*$/g, '').replace( /[^\d]/g, '');
      var start = date;
      var end = moment(date).add('hours', 1);
      $('#dialog-issue').dialogIssue('open', {
        event: {
          begin: start,
          end: end,
          all_day: allDay,
          issue: issue,
        },
        onClickOk: function(event) {
          $('#dialog-alert').dialogAlert('status', 'Please wait...');

          $.ajax({
            url: '/timesheet/events/create/',
            type: 'POST',
            data: {
              issue: event.issue,
              begin: moment(event.begin).format_notz(),
              end: moment(event.end).format_notz(),
              all_day: event.all_day,
            },
            success: function(data) {
              $('#dialog-issue').dialogIssue('close');
              for (var i = 0; i < data.length; i++) {
                calendar.fullCalendar('renderEvent', jsonD2F(data[i]));
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
              $('#dialog-alert').dialogAlert('error', 'Failure while creating event!');
            },
          });
        },
      });
    },
  });
  $('#redmine-issues-assigned').html('<div><i>Loading data...</i></div>');
  $.ajax({
    url: '/timesheet/redmine/issues/assigned/',
    type: 'POST',
    success: function(data) {
      var issues = $('#redmine-issues-assigned').html('');
      for (var d in data) {
        var issue = $('<div />');
        issue.css('background', colorize(d));
        issue.attr('class', 'redmine-issue');
        issue.attr('title', '[' + data[d].project + ']' + ' ' + data[d].subject);
        issue.append($('<div />').attr('class', 'redmine-issue-id').append(htmlize('#' + d)));
        issue.append($('<div />').attr('class', 'redmine-issue-project').append(htmlize(data[d].project)));
        issues.append(issue);
      }
      $('#redmine-issues-assigned div.redmine-issue').each(function() {
        // create an Event Object (http://arshaw.com/fullcalendar/docs/event_data/Event_Object/)
        // it doesn't need to have a start or end
        var eventObject = {
          title: $(this).text(), // use the element's text as the event title
        };
        // store the Event Object in the DOM element so we can get to it later
        $(this).data('eventObject', eventObject);
        // make the event draggable using jQuery UI
        $(this).draggable({
          zIndex: 1000,
          revert: true,      // will cause the event to go back to its
          revertDuration: 0, // original position after the drag
        });
      });
    },
    error: function(XMLHttpRequest, textStatus, errorThrown) {
      $('#redmine-issues-assigned').html('<div><i>Error loading data.</i></div><br />')
    },
  });
});

// vim:set et:
// vi:set sw=2 ts=2:
