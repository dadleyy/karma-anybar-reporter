const nanybar = require("nanybar");

const DEFAULT_CONFIG = {
  port : 1738,
  colors : {
    running : "yellow",
    failed : "red",
    success : "green"
  }
};

function reporter(base, karma_config) {
  base.call(this);

  const { anybar : user_config } = karma_config;
  const colors = Object.assign(DEFAULT_CONFIG.colors, user_config && user_config.colors);
  const port = user_config && user_config.port >= 1 ? user_config.port : DEFAULT_CONFIG.port;
  const errors = [];
  const passes = [];

  this.onRunStart = function() {
    errors.length = passes.length = 0;
    nanybar(colors.running, port);
  };

  this.onSpecComplete = function(browser, result) {
    const bucket = result.success ? passes : errors;

    bucket.push({ browser, result });
  };

  this.onRunComplete = function() {
    const color = errors.length ? colors.failed : colors.success;
    nanybar(color, port);
  };
}

reporter.$inject = [
  "baseReporterDecorator",
  "config"
];

module.exports = reporter;
