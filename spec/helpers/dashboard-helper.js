var fs = require('fs');

function read(f) {
  return fs.readFileSync(f).toString();
}

global.loadDashboard = function (f) {
  /* This is how Grafana loads scripted dashboards */
  return new Function('ARGS', 'kbn', '_', 'moment', 'window', 'document', '$', 'jQuery', 'services', read(f));
};

global.scriptedDashboard = function (f, args) {
  if (typeof args === "undefined") {
    args = {};
  }
  var kbn, _, moment, document, $, services;
  var window = {
    location: {
      protocol: 'https',
      hostname: 'grafana',
      port: ''}};
  var jQuery = {
    ajax: function (params) {
      params.success(["example.metric.1", "example.metric.2"]);
    }
  };
  return loadDashboard(f)(args, kbn, _, moment, window, document, $, jQuery, services);
};

global.asyncScriptedDashboard = function (args, callback) {
  if (typeof callback === 'undefined') {
    callback = jasmine.createSpy();
  }
  var dashboardFn = scriptedDashboard('foo.js', args);
  dashboardFn(callback);
  return callback.calls.argsFor(0)[0];
};
