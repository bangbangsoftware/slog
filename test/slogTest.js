var assert = require('chai').assert;

var slog = require('../slog');

describe('slog does in fact slog', function() {
    describe('getConf', function() {
        var tester = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": true

        }
        var conf = slog.getConf(tester);
        console.log("typeof conf.patt");
        console.log(conf.patt);
        it('conf log is correct', function() {
            assert.equal(conf.log, 'crossbow.log');
        });
        it('conf makes a regular expression', function() {
            assert.equal(conf.patt+"","/exception/i");
        });
    });
});
