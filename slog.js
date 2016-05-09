#!/bin/node

var q = require('q');
var fs = require('fs');
var saveConf = function(name, content) {
    var defer = q.defer();
    var data = JSON.stringify(content,null,2);
    console.log(data);
    fs.writeFile(name, data, function(err) {
        if (err) {
            console.error(new Error("Could not save config",err));
            defer.reject(err);
        }
        console.log("The " + name + " was saved!");
        defer.resolve(content);
    });
    return defer.promise;
}
module.exports.saveConf = saveConf;



var setupConf = function(conf) {
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
module.exports.setupConf = setupConf;


var Slack = require('slack-node');
var slack = new Slack();
var processChange = function(data, conf, slack) {
    "use strict";
    console.log("")
    console.log(new Date() + " Log has changed")
    if (conf.patt.test(data)) {
        console.log("About to slack")
        slack.setWebhook(conf.webhookUri);

        slack.webhook({
            channel: "#logs",
            username: "webhookbot",
            text: data,
            icon_emoji: ":ghost:"
        }, function(err, response) {
            console.log(response);
            if (err) {
                console.error(new Error("Eak something went bad",err));
            }
        });
    } else {
        console.log("Skipped telling slack about...")
        console.log(data);
        console.log("AS the regular expression '" + conf.contains + "' failed.");
    }
}
module.exports.processChange = processChange;


var fileExists = function(confileName) {
    try {
        // Query the entry
        stats = fs.lstatSync(confileName);

        // Is it a directory?
        if (stats.isFile()) {
            return true
        }
    } catch (e) {
        // console.log(e);
    }
    return false;
}
module.exports.fileExists = fileExists;


var tailAway = function(conf) {
    console.log("Let the log watching begin");
    if (fileExists(conf.log)) {
        var Tail = require('tail').Tail;
        var tail = new Tail(conf.log);
        var slack = new Slack();
        tail.on("line", function(data) {
            processChange(data, conf, slack);
        });

        tail.on("error", function(error) {
            console.error(new Error('ERROR: ', error));
        });
    } else {
        console.error(new Error("Cannot see to file log file: '" + conf.log + "'."));
        return false;
    }
}

var go = function(configs) {
    console.log("Setting up");
    var conf = setupConf(configs);
    tailAway(conf);
}

var ask = function() {
    var inquirer = require("inquirer");
    var questions = [{
        type: 'input',
        name: 'WebhookUri',
        message: 'What is your #slack webhookUri (See https://api.slack.com/incoming-webhooks)',
        default: 'https://hooks.slack.com/services/THIS-IS_MADE_UP'
    }, {
        type: 'input',
        name: 'log',
        message: 'What is your the full path to your log file',
        default: '/var/log/syslog'
    }, {
        type: 'input',
        name: 'contains',
        message: 'Is there any regular expression you want to filter by',
        default: 'ERROR'
    }, {
        type: 'confirm',
        name: 'IgnoreCase',
        message: 'Do you want to ignore case in your filter',
    }];

    return inquirer.prompt(questions);
}

var start = function() {
    "use strict";
    var confileName = './config.slog.json';
    if (fileExists(confileName)) {
        go(require(confileName));
    } else {
        ask().then(function(answers) {
            return saveConf(confileName, answers);
        }).then(function(c) {
            go(c);
        })
    };
};

start();
