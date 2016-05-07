#!/bin/node

var getConf = function(conf) {
    "use strict";
    conf.patt = {
        test: function(data) {
            return true;
        }
    };
    if (conf.contains) {
        if (conf.ignoreCase) {
            conf.patt = new RegExp(conf.contains, 'i');
        } else {
            conf.patt = new RegExp(conf.contains);
        }
        console.log("Set up regular expression with '" + conf.contains + "'.");
    }

    return conf;
}
module.exports.getConf = getConf;

var Slack = require('slack-node');
var slack = new Slack();

var processChange = function(data, conf,slack) {
    "use strict";
    console.log("")
    console.log(new Date() + " Log has changed")
    if (conf.patt.test(data)) {
        console.log("About to slack")
        var webhookUri = conf.webhookUri;
        slack.setWebhook(webhookUri);

        slack.webhook({
            channel: "#logs",
            username: "webhookbot",
            text: data,
            icon_emoji: ":ghost:"
        }, function(err, response) {
            console.log(response);
            if (err) {
                console.log("Eak something went bad");
                console.log(err);
            }
        });
    } else {
        console.log("Skipped telling slack about...")
        console.log(data);
        console.log("AS the regular expression '" + conf.contains + "' failed.");
    }
}
module.exports.processChange = processChange;

var go = function() {
    "use strict";

    var Tail = require('tail').Tail;
    var confile = require('./config.slog.json');
    var conf = getConf(confile);

    var tail = new Tail(conf.log);
    var slack = new Slack();
    tail.on("line", function(data) {
        processChange(data, conf, slack);
    });

    tail.on("error", function(error) {
        console.log('ERROR: ', error);
    });
};
go();
