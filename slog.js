#!/bin/node

var getConf = function() {
    return require('./config.slog.json');
}

var processChange = function(data, conf) {
    console.log("")
    console.log(new Date() + " Log has changed")
    if (conf.patt.test(data)) {
        console.log("About to slack")
        var webhookUri = conf.webhookUri;
        var slack = new Slack();
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

var go = function() {
    "use strict";

    var Tail = require('tail').Tail;
    var Slack = require('slack-node');
    var conf = getConf();

    var tail = new Tail(conf.log);
    conf.patt = function(data) {
        return true;
    }
    if (conf.contains) {
        conf.patt = new RegExp(conf.contains);
        console.log("Set up regular expression with '" + conf.contains + "'.");
    }

    tail.on("line", function(data) {
        processChange(data,conf);
    });

    tail.on("error", function(error) {
        console.log('ERROR: ', error);
    });
};
go();
