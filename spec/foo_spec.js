describe("Scriptable dashboard", function () {

  it("shows a help panel by default", function () {
    var dashboard = asyncScriptedDashboard();
    expect(dashboard.rows[0].title).toBe('Help');
  });

  it("does not show the help panel if no_help is passed", function () {
    var dashboard = asyncScriptedDashboard({no_help: true});
    expect(dashboard.rows.length).toBe(1);
  });

  it("shows a list of available metrics if none are specified", function () {
    var dashboard = asyncScriptedDashboard({no_help: true});
    expect(dashboard.rows[0].title).toBe('All Available Metrics');
    expect(dashboard.rows[0].panels[0].type).toBe('text');
    expect(dashboard.rows[0].panels[0].content).toContain('example.metric.1');
    expect(dashboard.rows[0].panels[0].content).toContain('example.metric.2');
  });

  it("graphs the specified metric", function () {
    var dashboard = asyncScriptedDashboard({
      no_help: true,
      m1: 'example.metric.2'});
    expect(dashboard.rows[0].title).toBe('Title');
    expect(dashboard.rows[0].panels[0].type).toBe('graphite');
    expect(dashboard.rows[0].panels[0].targets[0].target).toBe('example.metric.2');
  });

  it("graphs multiple metrics", function () {
    var dashboard = asyncScriptedDashboard({
      no_help: true,
      m1: 'example.metric.1',
      m2: 'example.metric.2'});
    expect(dashboard.rows.length).toBe(1);
    expect(dashboard.rows[0].title).toBe('Title');
    expect(dashboard.rows[0].panels[0].targets[0].target).toBe('example.metric.1');
    expect(dashboard.rows[0].panels[0].targets[1].target).toBe('example.metric.2');
  });

  it("displays specified thresholds on the graph", function () {
    var dashboard = asyncScriptedDashboard({
      no_help: true,
      m1: 'example.metric.1',
      m2: 'example.metric.2',
      threshold1: '5',
      threshold2: '10'});
    expect(dashboard.rows[0].panels[0].grid.threshold1).toBe(5.0);
    expect(dashboard.rows[0].panels[0].grid.threshold2).toBe(10.0);
  });

});
