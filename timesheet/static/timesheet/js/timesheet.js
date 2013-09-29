/*
 * CRC32
 */
(function() {
  var crc32_table = [
    0x00000000, 0x77073096, 0xee0e612c, 0x990951ba,
    0x076dc419, 0x706af48f, 0xe963a535, 0x9e6495a3,
    0x0edb8832, 0x79dcb8a4, 0xe0d5e91e, 0x97d2d988,
    0x09b64c2b, 0x7eb17cbd, 0xe7b82d07, 0x90bf1d91,
    0x1db71064, 0x6ab020f2, 0xf3b97148, 0x84be41de,
    0x1adad47d, 0x6ddde4eb, 0xf4d4b551, 0x83d385c7,
    0x136c9856, 0x646ba8c0, 0xfd62f97a, 0x8a65c9ec,
    0x14015c4f, 0x63066cd9, 0xfa0f3d63, 0x8d080df5,
    0x3b6e20c8, 0x4c69105e, 0xd56041e4, 0xa2677172,
    0x3c03e4d1, 0x4b04d447, 0xd20d85fd, 0xa50ab56b,
    0x35b5a8fa, 0x42b2986c, 0xdbbbc9d6, 0xacbcf940,
    0x32d86ce3, 0x45df5c75, 0xdcd60dcf, 0xabd13d59,
    0x26d930ac, 0x51de003a, 0xc8d75180, 0xbfd06116,
    0x21b4f4b5, 0x56b3c423, 0xcfba9599, 0xb8bda50f,
    0x2802b89e, 0x5f058808, 0xc60cd9b2, 0xb10be924,
    0x2f6f7c87, 0x58684c11, 0xc1611dab, 0xb6662d3d,
    0x76dc4190, 0x01db7106, 0x98d220bc, 0xefd5102a,
    0x71b18589, 0x06b6b51f, 0x9fbfe4a5, 0xe8b8d433,
    0x7807c9a2, 0x0f00f934, 0x9609a88e, 0xe10e9818,
    0x7f6a0dbb, 0x086d3d2d, 0x91646c97, 0xe6635c01,
    0x6b6b51f4, 0x1c6c6162, 0x856530d8, 0xf262004e,
    0x6c0695ed, 0x1b01a57b, 0x8208f4c1, 0xf50fc457,
    0x65b0d9c6, 0x12b7e950, 0x8bbeb8ea, 0xfcb9887c,
    0x62dd1ddf, 0x15da2d49, 0x8cd37cf3, 0xfbd44c65,
    0x4db26158, 0x3ab551ce, 0xa3bc0074, 0xd4bb30e2,
    0x4adfa541, 0x3dd895d7, 0xa4d1c46d, 0xd3d6f4fb,
    0x4369e96a, 0x346ed9fc, 0xad678846, 0xda60b8d0,
    0x44042d73, 0x33031de5, 0xaa0a4c5f, 0xdd0d7cc9,
    0x5005713c, 0x270241aa, 0xbe0b1010, 0xc90c2086,
    0x5768b525, 0x206f85b3, 0xb966d409, 0xce61e49f,
    0x5edef90e, 0x29d9c998, 0xb0d09822, 0xc7d7a8b4,
    0x59b33d17, 0x2eb40d81, 0xb7bd5c3b, 0xc0ba6cad,
    0xedb88320, 0x9abfb3b6, 0x03b6e20c, 0x74b1d29a,
    0xead54739, 0x9dd277af, 0x04db2615, 0x73dc1683,
    0xe3630b12, 0x94643b84, 0x0d6d6a3e, 0x7a6a5aa8,
    0xe40ecf0b, 0x9309ff9d, 0x0a00ae27, 0x7d079eb1,
    0xf00f9344, 0x8708a3d2, 0x1e01f268, 0x6906c2fe,
    0xf762575d, 0x806567cb, 0x196c3671, 0x6e6b06e7,
    0xfed41b76, 0x89d32be0, 0x10da7a5a, 0x67dd4acc,
    0xf9b9df6f, 0x8ebeeff9, 0x17b7be43, 0x60b08ed5,
    0xd6d6a3e8, 0xa1d1937e, 0x38d8c2c4, 0x4fdff252,
    0xd1bb67f1, 0xa6bc5767, 0x3fb506dd, 0x48b2364b,
    0xd80d2bda, 0xaf0a1b4c, 0x36034af6, 0x41047a60,
    0xdf60efc3, 0xa867df55, 0x316e8eef, 0x4669be79,
    0xcb61b38c, 0xbc66831a, 0x256fd2a0, 0x5268e236,
    0xcc0c7795, 0xbb0b4703, 0x220216b9, 0x5505262f,
    0xc5ba3bbe, 0xb2bd0b28, 0x2bb45a92, 0x5cb36a04,
    0xc2d7ffa7, 0xb5d0cf31, 0x2cd99e8b, 0x5bdeae1d,
    0x9b64c2b0, 0xec63f226, 0x756aa39c, 0x026d930a,
    0x9c0906a9, 0xeb0e363f, 0x72076785, 0x05005713,
    0x95bf4a82, 0xe2b87a14, 0x7bb12bae, 0x0cb61b38,
    0x92d28e9b, 0xe5d5be0d, 0x7cdcefb7, 0x0bdbdf21,
    0x86d3d2d4, 0xf1d4e242, 0x68ddb3f8, 0x1fda836e,
    0x81be16cd, 0xf6b9265b, 0x6fb077e1, 0x18b74777,
    0x88085ae6, 0xff0f6a70, 0x66063bca, 0x11010b5c,
    0x8f659eff, 0xf862ae69, 0x616bffd3, 0x166ccf45,
    0xa00ae278, 0xd70dd2ee, 0x4e048354, 0x3903b3c2,
    0xa7672661, 0xd06016f7, 0x4969474d, 0x3e6e77db,
    0xaed16a4a, 0xd9d65adc, 0x40df0b66, 0x37d83bf0,
    0xa9bcae53, 0xdebb9ec5, 0x47b2cf7f, 0x30b5ffe9,
    0xbdbdf21c, 0xcabac28a, 0x53b39330, 0x24b4a3a6,
    0xbad03605, 0xcdd70693, 0x54de5729, 0x23d967bf,
    0xb3667a2e, 0xc4614ab8, 0x5d681b02, 0x2a6f2b94,
    0xb40bbe37, 0xc30c8ea1, 0x5a05df1b, 0x2d02ef8d
  ];

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
  var numberToString = function(num, len) {
    var str = '0000' + num;
    return str.substr(str.length - len);
  }

  Date.prototype.ddmmyyyy = function() {
    return numberToString(this.getDate(), 2) + '/' +
      numberToString(this.getMonth() + 1, 2) + '/' +
      numberToString(this.getFullYear(), 4);
  }

  Date.prototype.hhmm = function() {
    return numberToString(this.getHours(), 2) + ':' +
      numberToString(this.getMinutes(), 2);
  }

  Date.prototype.toISO = function() {
    return numberToString(this.getFullYear(), 4) + '-' +
      numberToString(this.getMonth() + 1, 2) + '-' +
      numberToString(this.getDate(), 2) + 'T' +
      numberToString(this.getHours(), 2) + ':' +
      numberToString(this.getMinutes(), 2) + ':' +
      numberToString(this.getSeconds(), 2);
  }

  Date.prototype.offsetTZ = function() {
    this.setTime(this.getTime() + (this.getTimezoneOffset() * 60 * 1000));
    return this;
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

/*
 * An stupid way to generate different colors.
 */
(function($) {
  var luminance = function(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
  }

  colorize = function(number) {
    var crc = crc32('' + number);

    /* Put the colors between 32 and 223. */
    var r = (crc >> 16) & 0xff;
    var g = (crc >>  8) & 0xff;
    var b = (crc      ) & 0xff;

    var l = luminance(r, g, b);

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
  }
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
  }

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
  }

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

    this.element.find('#date').val(this.event.begin.ddmmyyyy());
    if (this.event.all_day) {
      this.element.find('.issue-time').hide();
      this.element.find('#allday').prop('checked', true);
    } else {
      this.element.find('.issue-time').show();
      this.element.find('#allday').prop('checked', false);
      this.element.find('#begin.text').val(this.event.begin.hhmm());
      this.element.find('#end.text').val(this.event.end.hhmm());
    }
    this.element.find('#issue.text').val(this.event.issue);

    this.element.dialog('open');
  }

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
  }

  DialogIssue.prototype.delete = function() {
    if (this.onClickDelete != null) {
      this.onClickDelete(this.event);
    } else {
      this.close();
    }
  }

  DialogIssue.prototype.cancel = function() {
    this.close();
  }

  DialogIssue.prototype.close = function() {
    this.element.dialog('close');
  }
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
  }

  var DialogAlert = function(element, options) {
    var this_ = this;

    this.element = element;
    this.options = options;

    element.html('<p style="text-align: center;"></p>');
    element.dialog({
      modal: true,
      autoOpen: false,
    });
  }

  DialogAlert.prototype.status = function(message) {
    this.element.parent().find('.ui-dialog-titlebar :button').hide()
    this.element.dialog('option', 'closeOnEscape', false);
    this.element.dialog('option', 'title', 'Status');
    this.element.find('p').text(message);
    this.element.dialog('open');
  }

  DialogAlert.prototype.error = function(message) {
    this.element.parent().find('.ui-dialog-titlebar :button').show()
    this.element.dialog('option', 'closeOnEscape', true);
    this.element.dialog('option', 'title', 'Error');
    this.element.find('p').text(message);
    this.element.dialog('open');
  }

  DialogAlert.prototype.close = function() {
    this.element.dialog('close');
  }
})(jQuery);

/*
 * Diffluens + FullCalendar integration stuff.
 */
(function() {
  jsonD2F = function(d, f) {
    if (f == null) {
      f = {};
    }
    f.id = d.id;
    f.allDay = d.all_day;
    f.start = new Date(d.begin).offsetTZ();
    f.end = new Date(d.end).offsetTZ();
    f.title = '' + d.issue;
    f.color = colorize(d.issue);
    return f;
  }
 jsonF2D = function(f, d) {
    if (d == null) {
      d = {}
    }
    d.id = f.id;
    d.all_day = f.allDay;
    d.begin = f.start.toISO();
    d.end = f.end.toISO();
    d.issue = parseInt(f.title);
    return d;
  }
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
          for (var i = 0; i < data.length; i++) {
            data[i] = jsonD2F(data[i]);
          }
          callback(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
          $('#dialog-alert').dialogAlert('error', 'Failure while fetching events!');
        },
      });
    },
    selectable: true,
    selectHelper: true,
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
              begin: event.begin.toISO(),
              end: event.end.toISO(),
              all_day: event.all_day,
            },
            success: function (data) {
              $('#dialog-issue').dialogIssue('close');
              for (var i = 0; i < data.length; i++) {
                $('#calendar').fullCalendar('renderEvent', jsonD2F(data[i]));
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
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
              begin: event.begin.toISO(),
              end: event.end == null ? undefined : event.end.toISO(),
              all_day: event.all_day,
            },
            success: function (data) {
              $('#dialog-issue').dialogIssue('close');
              if (data.length != 1) {
                // Here we must delete all events by their ids first and then add
                // all received events back again. We MUST NOT do in the same
                // loop for almost obvious reasons I don't want to explain now.
                for (var i = 0; i < data.length; i++) {
                  $('#calendar').fullCalendar('removeEvents', data[i].id);
                }
                for (var i = 0; i < data.length; i++) {
                  $('#calendar').fullCalendar('renderEvent', jsonD2F(data[i]));
                }
              } else {
                jsonD2F(data[0], fc_event);
                $('#calendar').fullCalendar('updateEvent', fc_event);
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
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
            success: function (data) {
              $('#dialog-issue').dialogIssue('close');
              for (var i = 0; i < data.length; i++) {
                $('#calendar').fullCalendar('removeEvents', data[i].id);
              }
              $('#dialog-alert').dialogAlert('close');
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
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
        success: function (data) {
          if (data.length != 1) {
            // Here we must delete all events by their ids first and then add
            // all received events back again. We MUST NOT do in the same
            // loop for almost obvious reasons I don't want to explain now.
            for (var i = 0; i < data.length; i++) {
              $('#calendar').fullCalendar('removeEvents', data[i].id);
            }
            for (var i = 0; i < data.length; i++) {
              $('#calendar').fullCalendar('renderEvent', jsonD2F(data[i]));
            }
          } else {
            jsonD2F(data[0], event);
            $('#calendar').fullCalendar('updateEvent', event);
          }
          $('#dialog-alert').dialogAlert('close');
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
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
        success: function (data) {
          if (data.length != 1) {
            // Here we must delete all events by their ids first and then add
            // all received events back again. We MUST NOT do in the same
            // loop for almost obvious reasons I don't want to explain now.
            for (var i = 0; i < data.length; i++) {
              $('#calendar').fullCalendar('removeEvents', data[i].id);
            }
            for (var i = 0; i < data.length; i++) {
              $('#calendar').fullCalendar('renderEvent', jsonD2F(data[i]));
            }
          } else {
            jsonD2F(data[0], event);
            $('#calendar').fullCalendar('updateEvent', event);
          }
          $('#dialog-alert').dialogAlert('close');
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
          revertFunc();
          $('#dialog-alert').dialogAlert('error', 'Failure while moving event!');
        },
      });
    },
  });
});

// vim:set et:
// vi:set sw=2 ts=2:
