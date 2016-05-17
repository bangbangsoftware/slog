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
        conf.override = true;
        slog.processChange(data2, conf, slack2);
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

    describe('processChange should send when override is true and send presend data', function() {

        var webh = "notSet";
        var sentData = [];
        var slack2 = {
            setWebhook: function(d) {
                webh = d;
            },
            webhook: function(sd, cb) {
                console.log("webhook-ed");
                sentData.push(sd);
                var err = undefined;
                var response = "BANG";
                cb(err, response);
            }
        };

        var presendData = ["Sat May 07 2016 16:58:12 GMT+0100 (BST) - just some..",
            "Sat May 07 2016 16:58:12 GMT+0100 (BST) - loggingg..",
            "Sat May 07 2016 16:58:12 GMT+0100 (BST) - before the debug..",
            "Sat May 07 2016 16:58:12 GMT+0100 (BST) - RegExp. fails with this debug.."
        ];
        conf.presend = presendData;
        conf.override = true;
        var data2 = "Sat May 07 2016 16:58:12 GMT+0100 (BST) - RegExp. fails with this debug..";
        var expect = {
            channel: "#logs",
            username: "webhookbot",
            icon_emoji: ":ghost:"
        };
        slog.processChange(data2, conf, slack2);
        it('has set the right webhookUri', function() {
            assert.equal(webh, conf.webhookUri);
        });
        it('has set the right channel', function() {
            assert.equal(sentData[0].channel, expect.channel);
        });
        it('has set the right username', function() {
            assert.equal(sentData[0].username, expect.username);
        });
        it('has set the right icon', function() {
            assert.equal(sentData[0].icon_emoji, expect.icon_emoji);
        });

        it('has set the right text', function() {
            assert.equal(sentData[0].text, presendData[0]);
        });
        it('has set the right text', function() {
            assert.equal(sentData[1].text, presendData[1]);
        });
        it('has set the right text', function() {
            assert.equal(sentData[2].text, presendData[2]);
        });
        it('has set the right text', function() {
            assert.equal(sentData[3].text, presendData[3]);
        });
        it('has set the right text', function() {
            assert.equal(sentData[4].text, data2);
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

    describe('storeBefore', function() {
        var conf = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": true,
            "after": 0,
            "before": 0,
            "presend": []

        };
        var data = "0. don't store before";
        it('should not store before if before is zero', function() {
            slog.storeBefore(conf, data);
            assert.equal(conf.presend.length, 0);
        });
        it('should store before if before is  bigger than zero', function() {
            data = "1. do store before";
            conf.before = 3;
            slog.storeBefore(conf, data);
            assert.equal(conf.presend.length, 1);
        });
        it('should keep storing before', function() {
            data = "2. do store before again";
            conf.before = 3;
            slog.storeBefore(conf, data);
            assert.equal(conf.presend.length, 2);
        });
        it('should keep storing before again', function() {
            data = "3. do store before and again";
            conf.before = 3;
            slog.storeBefore(conf, data);
            assert.equal(conf.presend.length, 3);
        });
        it('should keep storing before again and truncate the list', function() {
            data = "4. do store before and yet again";
            conf.before = 3;
            slog.storeBefore(conf, data);
            assert.equal(conf.presend.length, 3);
            assert.equal(conf.presend[0], "2. do store before again");
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


    describe('lineProcess should send before and after log lines', function() {
        var confile2 = {
            "webhookUri": "https://hooks.slack.com/services/boom",
            "log": "crossbow.log",
            "contains": "exception",
            "ignoreCase": true,
            "after": 3,
            "before": 3
        };
        var conf2 = slog.setupConf(confile2);

        var data = ["Sat May 07 2016 16:00:58 GMT+0100 (BST) - BEFORE-1: Just normal debug.....",
            "Sat May 07 2016 16:00:59 GMT+0100 (BST) - BEFORE-2: Just normal debug.....",
            "Sat May 07 2016 16:01:01 GMT+0100 (BST) - BEFORE-3: Just normal debug.....",
            "Sat May 07 2016 16:01:02 GMT+0100 (BST) - BEFORE-4: Just normal debug.....",
            "Sat May 07 2016 17:01:03 GMT+0100 (BST) - FOUND: Exception......",
            "Sat May 07 2016 17:01:04 GMT+0100 (BST) - AFTER-1: stack trace......",
            "Sat May 07 2016 17:01:05 GMT+0100 (BST) - AFTER-2: stack trace......",
            "Sat May 07 2016 17:01:06 GMT+0100 (BST) - AFTER-3: stack trace......",
            "Sat May 07 2016 17:01:07 GMT+0100 (BST) - AFTER-4: stack trace......"
        ];
        var webh = confile.webhookUri;
        var sendData = [];
        var slack = {
            setWebhook: function(d) {
                webh = d;
            },
            webhook: function(sd, cb) {
                console.log("webhook-ed");
                sendData.push(sd);
                var err = undefined;
                var response = "BANG";
                cb(err, response);
            }
        };
        data.forEach(function(dataItem) {
            console.log("data item is ", dataItem);
            slog.lineProcess(dataItem, conf2, slack, 0);
        });
        it('has set the right webhookUri', function() {
            assert.equal(webh, conf2.webhookUri);
        });
        it('has send the correct amount of data', function() {
            assert.equal(sendData.length, 7);
        });

        var x = 1;
        sendData.forEach(function(sd) {
            it(x + ' has send the correct data', function() {
                assert.equal(sd.text, data[x]);
                ++x;
            });
        })

    });

});
