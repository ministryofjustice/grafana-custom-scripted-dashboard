/*
 * Complex scripted dashboard
 * This script generates a dashboard object that Grafana can load. It also takes
 * a number of user supplied URL parameters (in the ARGS variable)
 *
 * Return a dashboard object, or a function
 *
 * For async scripts, return a function, this function must take a single
 * callback function as argument, call this callback function with the dashboard
 * object (look at scripted_async.js for an example)
 */

// accessible variables in this scope
var window, document, ARGS, $, jQuery, moment, kbn;

function is_defined(var_) {
  'use strict';
  return typeof var_ !== 'undefined';
}

function getattr(attr, obj, default_) {
  'use strict';
  return is_defined(obj) && (attr in obj) ? obj[attr] : default_;
}

var debug = getattr('debug', ARGS, false);
var no_help = getattr('no_help', ARGS, false);
var targets = enum_args('m');
var threshold1 = parseFloat(getattr('threshold1', ARGS, null));
var threshold2 = parseFloat(getattr('threshold2', ARGS, null));

function enum_args(prefix) {
  var arg_pattern = new RegExp('^' + prefix + '(\\d+)$');
  var found = [];
  for (var arg in ARGS) {
    var m = arg.match(arg_pattern);
    if (m) {
      found[parseInt(m[1]) - 1] = (ARGS[arg]);
    }
  }
  return found.filter(function (arg) { return !!arg; });
}

function row(title, panels) {
  return {
    title: title,
    height: '250px',
    collapse: false,
    panels: panels
  };
}

function markdownTextPanel(title, markdown) {
  return {
    title: title,
    type: 'text',
    mode: 'markdown',
    span: 8,
    error: false,
    content: markdown,
    style: {}
  };
}

function debug_row(dashboard) {
  return row('Debug', [markdownTextPanel('debug', mdEscape(JSON.stringify(dashboard)))]);
}

function help_row() {
  return row('Help', [markdownTextPanel('Help', [
    '### How to use this dashboard',
    '',
    'This dashboard expects a pipe-separated list of graphite target',
    'paths.',
    '',
    'These will typically need to be URI encoded.',
    '',
    'The graphs will then be displayed in order, as individual graphs.',
    '',
    'Arguments:',
    '',
    '* `no_help` -- omit this panel',
    '* `m1={target1}`&`m2={target2}`&`m3=...`',
    '* `refresh={interval}` override default refresh interval of `1min`',
    ''].join('\n'))]);
}

function metrics_list_row() {
  return row('All Available Metrics', [markdownTextPanel(
    'All Available Metrics', [
      '### Available raw targets:',
      '',
      mdLinksToAllMetrics(),
      ''].join('\n'))]);
}

function mdEscape(text) {
  var need_escape = new RegExp('([\\`*_\\{\\}\\[\\]\\(\\)#+-\\.!])', 'g');
  function escape(str, char) { return '\\' + char; }
  return text.replace(need_escape, escape);
}

function mdLinksToAllMetrics() {
  var dashboard = 'dashboard/script/foo.js';
  var i = 0;
  return allTargets().map(function (target) {
    i = i + 1;
    return '* [' + mdEscape(target) + ']' +
      '(/#/' + dashboard + '?m' + i + '=' + target + '&no_help=1)';
  }).join('\n');
}

function allTargets() {
  var metrics_url = 'https://graphite-staging.service.dsd.io/metrics/index.json';
  //var metrics_url = window.location.protocol + '//' +
    //window.location.hostname.replace(/^grafana/, 'graphite') +
    //(window.location.port ? ':' + window.location.port : '') +
    //'/metrics/index.json';
  var metrics = [];
  jQuery.ajax({
    url: metrics_url,
    async: false,
    dataType: 'json',
    success: function (response) {
      metrics = response;
    }
  });
  return metrics;
}

function custom_metric_row(title, targets) {
  return row(title, [
    {
      title: title,
      type: 'graphite',
      span: 8,
      renderer: 'flot',
      y_formats: ['none', 'none'],
      grid: {
        max: null,
        min: 0,
        threshold1: threshold1,
        threshold2: threshold2,
        threshold1Color: 'rgba(216, 200, 27, 0.27)',
        threshold2Color: 'rgba(234, 112, 112, 0.22)'
      },
      lines: true,
      fill: 0,
      linewidth: 2,
      stack: false,
      legend: {show: true},
      percentage: false,
      nullPointMode: 'null',
      tooltip: {
        value_type: 'individual',
        query_as_alias: true
      },
      targets: targets.map(function (target) { return {target: target}; })
    }]);
}

return function (callback) {
  'use strict';

  // Intialize a skeleton with nothing but a rows array and service object
  // time can be overriden in the url using from/to parameters, but this is
  // handled automatically in grafana core during dashboard initialization
  var dashboard = {
    title: 'Scripted dash',
    rows: [],
    services: {},
    time: {
      from: 'now-6h',
      to: 'now'
    }
  };

  if (!no_help) {
    dashboard.rows.push(help_row());
  }

  if (targets.length) {
    dashboard.rows.push(custom_metric_row('Title', targets));
  } else {
    dashboard.rows.push(metrics_list_row());
  }

  if (debug) {
    dashboard.rows.unshift(debug_row(dashboard));
  }

  callback(dashboard);
};
