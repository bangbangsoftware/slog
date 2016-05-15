var assert = require('chai').assert;

var slog = require('../slog');

describe('slog does in fact slog', function() {
    describe('setupConf', function() {
        var tester = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": false,
            "after": 0
        };
        var conf = slog.setupConf(tester);
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
            "ignoreCase": true,
            "after": 0
        };

        var confic = slog.setupConf(ignoreCase);
        console.log(confic);
        it('conf makes a regular expression which ignore case', function() {
            assert.equal(confic.patt.test("EXCEPTION"), true);
        });

        var noContains = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
        };
        var conf2 = slog.setupConf(noContains);
        it('conf makes a default always true pattern', function() {
            assert.equal(conf2.patt.test("adhfjhdsf"), true);
        });
    });
    var confile = {
        "webhookUri": "https://hooks.slack.com/services/boom",
        "log": "crossbow.log",
        "contains": "exception",
        "ignoreCase": true,
        "after": 0
    };
    var conf = slog.setupConf(confile);

    describe('processChange should ignore when RegExp fails', function() {
        var data = "Sat May 07 2016 16:58:12 GMT+0100 (BST) - Just normal debug.....";
        var webh = confile.webhookUri;
        var sendData = "notSet";
        var slack = {
            setWebhook: function(d) {
                webh = d;
            },
            webhook: function(sd, cb) {
                console.log("webhook-ed");
                sendData = sd;
                var err = undefined;
                var response = "BANG";
                cb(err, response);
            }
        };
        slog.processChange(data, conf, slack, 0);
        it('has set the right webhookUri', function() {
            assert.equal(webh, conf.webhookUri);
        });
        it('has not send any data', function() {
            assert.equal(sendData, "notSet");
        });
    });

    describe('processChange should send when RegExp passes', function() {
        var webh = confile.webhookUri;
        var sendData2 = "notSet";
        var slack2 = {
            setWebhook: function(d) {
                webh = d;
            },
            webhook: function(sd, cb) {
                console.log("webhook-ed");
                sendData2 = sd;
                var err = undefined;
                var response = "BANG";
                cb(err, response);
            }
        };
        var data2 = "Sat May 07 2016 16:58:12 GMT+0100 (BST) - Null Pointer Exception.....";
        var expect = {
            channel: "#logs",
            username: "webhookbot",
            text: data2,
            icon_emoji: ":ghost:"
        };
        slog.processChange(data2, conf, slack2, false);
        it('has set the right webhookUri', function() {
            assert.equal(webh, conf.webhookUri);
        });
        it('has set the right channel', function() {
            assert.equal(sendData2.channel, expect.channel);
        });
        it('has set the right username', function() {
            assert.equal(sendData2.username, expect.username);
        });
        it('has set the right text', function() {
            assert.equal(sendData2.text, expect.text);
        });
        it('has set the right icon', function() {
            assert.equal(sendData2.icon_emoji, expect.icon_emoji);
        });
    });

    describe('processChange should send when override is true', function() {

        var webh = "notSet";
        var sendData2 = "notSet";
        var slack2 = {
            setWebhook: function(d) {
                webh = d;
            },
            webhook: function(sd, cb) {
                console.log("webhook-ed");
                sendData2 = sd;
                var err = undefined;
                var response = "BANG";
                cb(err, response);
            }
        };

        var data2 = "Sat May 07 2016 16:58:12 GMT+0100 (BST) - RegExp. fails with this debug..";
        var expect = {
            channel: "#logs",
            username: "webhookbot",
            text: data2,
            icon_emoji: ":ghost:"
        };
        slog.processChange(data2, conf, slack2, true);
        it('has set the right webhookUri', function() {
            assert.equal(webh, conf.webhookUri);
        });
        it('has set the right channel', function() {
            assert.equal(sendData2.channel, expect.channel);
        });
        it('has set the right username', function() {
            assert.equal(sendData2.username, expect.username);
        });
        it('has set the right text', function() {
            assert.equal(sendData2.text, expect.text);
        });
        it('has set the right icon', function() {
            assert.equal(sendData2.icon_emoji, expect.icon_emoji);
        });

    });

    describe('setOverride', function() {
        it('should not override by default', function() {
            var overide = slog.setOverride(conf);
            assert.equal(overide, false);
        });
        it('should set override if after is set and count down', function() {
            conf.after = 3;    
            var overide = slog.setOverride(conf);
            assert.equal(overide, true);
            assert.equal(conf.leftToTail, 3);
            
            overide = slog.setOverride(conf);
            assert.equal(overide, true);
            assert.equal(conf.leftToTail, 2);
            
            overide = slog.setOverride(conf);
            assert.equal(overide, true);
            assert.equal(conf.leftToTail, 1);

            overide = slog.setOverride(conf);
            assert.equal(overide, false);
        });


    });


    describe('saveConf', function() {
        var conf = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": true,
            "after": 0
        };
        var confileName = './config.TEST.slog.json';
        if (slog.fileExists(confileName)) {
            var fs = require('fs');
            fs.unlink(confileName);
        }
        slog.saveConf(confileName, conf);
        it('has created a configuration file', function() {
            assert(slog.fileExists(confileName), true);
        });

    });



});
