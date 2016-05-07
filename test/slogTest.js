var assert = require('chai').assert;

var slog = require('../slog');

describe('slog does in fact slog', function() {
    describe('getConf', function() {
        var tester = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": false
        };
        var conf = slog.getConf(tester);
        it('conf log is correct', function() {
            assert.equal(conf.log, 'crossbow.log');
        });
        it('conf makes a regular expression', function() {
            assert.equal(conf.patt.test("EXCEPTION"), false);
            assert.equal(conf.patt.test("exception"), true);
        });

        var ignoreCase = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": true
        };

        var confic = slog.getConf(ignoreCase);
        console.log(confic);
        it('conf makes a regular expression which ignore case', function() {
            assert.equal(confic.patt.test("EXCEPTION"), true);
        });

        var noContains = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
        };
        var conf2 = slog.getConf(noContains);
        it('conf makes a default always true pattern', function() {
            assert.equal(conf2.patt.test("adhfjhdsf"), true);
        });
    });
    describe('processChange', function() {
        var confile = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": false
        };
        var conf = slog.getConf(confile);
        var data = {};
        var slack = {
            setWebhook: function(d) {}
        };
        slog.processChange(data, conf, slack);

    });
});
