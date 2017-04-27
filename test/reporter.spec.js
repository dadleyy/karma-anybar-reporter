const assert = require("assert");
const dgram = require('dgram');
const reporter = require("../lib/reporter");

describe("reporter test suite", function() {

  const config = {
    port: 1337,
    colors: {
      running: "blue",
      failed: "red",
      success: "green"
    }
  };

  const base = function() { }
  const server = dgram.createSocket('udp4');
  const messages = [ ];

  let bag = null;

  before(function(done) {
    server.bind(config.port);

    messages.length = 0;

    server.on("message", function(msg) {
      const { callbacks } = bag;
      messages.push(msg);

      while(callbacks && callbacks.length) {
        let next = callbacks.shift();
        process.nextTick(next);
      }
    });

    server.on("listening", function() {
      return done();
    });
  });

  after(function() {
    server.close();
  });

  describe("having created the reporter w/ it's injections", function() {

    beforeEach(function() {
      const context = { };
      const callbacks = [ ];
      bag = { context, callbacks };
      const karma_config = { anybar: config };
      reporter.apply(context, [base, karma_config]);
    });

    it("has defined `onRunComplete`", function() {
      assert.equal(typeof bag.context.onRunComplete, "function");
    });

    it("has defined `onRunStart`", function() {
      assert.equal(typeof bag.context.onRunStart, "function");
    });

    it("has defined `onSpecComplete`", function() {
      assert.equal(typeof bag.context.onSpecComplete, "function");
    });

    describe("when starting a new run", function() {

      beforeEach(function(done) {
        bag.callbacks.push(done);
        bag.context.onRunStart();
      });

      afterEach(function() {
      });

      it("should have sent a color message", function() {
        const latest = messages.pop();
        assert.equal(latest.toString(), config.colors.running);
      });

      describe("having received only successfull tests and then finished", function() {

        beforeEach(function(done) {
          bag.context.onSpecComplete(null, { success: true });
          bag.callbacks.push(done);
          bag.context.onRunComplete();
        });

        it("should have sent a color message", function() {
          const latest = messages.pop();
          assert.equal(latest.toString(), config.colors.success);
        });

      });

      describe("having received an unsuccessful test and then finished", function() {

        beforeEach(function(done) {
          bag.context.onSpecComplete(null, { });
          bag.callbacks.push(done);
          bag.context.onRunComplete();
        });

        it("should have sent a color message", function() {
          const latest = messages.pop();
          assert.equal(latest.toString(), config.colors.failed);
        });

      });

    });

  });

});
