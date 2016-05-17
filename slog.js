#!/bin/node

var q = require('q');
var fs = require('fs');
var saveConf = function(name, content) {
    var defer = q.defer();
    var data = JSON.stringify(content, null, 2);
    console.log(data);
    fs.writeFile(name, data, function(err) {
        if (err) {
            console.error(new Error("Could not save config", err));
            defer.reject(err);
        }
        console.log("The " + name + " was saved!");
        defer.resolve(content);
    });
    return defer.promise;
};
module.exports.saveConf = saveConf;



var setupConf = function(conf) {
    "use strict";
    conf.patt = {
        test: function() {
            return true;
        }
    };
    conf.leftToTail = 0;
    conf.override = false;
    conf.presend = [];
    if (conf.contains) {
        if (conf.ignoreCase) {
            conf.patt = new RegExp(conf.contains, 'i');
        } else {
            conf.patt = new RegExp(conf.contains);
        }
        console.log("Set up regular expression with '" + conf.contains + "'.");
    }

    return conf;
};
module.exports.setupConf = setupConf;


var Slack = require('slack-node');
var sendToSlack = function(slack, data, conf) {
    console.log("About to slack");
    slack.setWebhook(conf.webhookUri);
    var payload = {
        channel: "#logs",
        username: "webhookbot",
        text: data,
        icon_emoji: ":ghost:"
    };
    slack.webhook(payload, function(err, response) {
        console.log(response);
        if (err) {
            console.log(conf.webhookUri);
            console.log(payload);
            console.log(err);
            console.error(new Error("Eak something went bad", err));
            process.exit(1);
        }
    });
};

var processChange = function(data, conf, slack) {
    "use strict";
    console.log("");
    console.log(new Date() + " Log has changed");
    if (conf.patt.test(data) || conf.override) {
        if (conf.override) {
            console.log("has been overriden");
        }
        conf.presend.forEach(function(preData) {
            sendToSlack(slack, preData, conf);
        });
        sendToSlack(slack, data, conf);
        return true;
    } else {
        console.log("Skipped telling slack about...");
        console.log(data);
        console.log("AS the regular expression '" + conf.contains + "' failed.");
    }
    return false;
};
module.exports.processChange = processChange;


var fileExists = function(confileName) {
    try {
        // Query the entry
        var stats = fs.lstatSync(confileName);

        // Is it a directory?
        if (stats.isFile()) {
            return true;
        }
    } catch (e) {
        // console.log(e);
    }
    return false;
};
module.exports.fileExists = fileExists;

var setOverride = function(conf) {
    if (conf.after > 0) {
        if (conf.leftToTail === 0) {
            conf.leftToTail = conf.after;
        } else {
            --conf.leftToTail;
        }
        if (conf.leftToTail > 0) {
            console.log(conf.leftToTail, ". Override");
            return true;
        }
    }
    console.log("No override");
    return false;
};
module.exports.setOverride = setOverride;

var storeBefore = function(conf, data) {
    if (conf.before < 1) {
        return;
    }
    if (conf.presend.length === conf.before) {
        console.log("truncating Before");
        conf.presend.shift();
    }
    console.log("Saving Before");
    conf.presend.push(data);
};
module.exports.storeBefore = storeBefore;

var lineProcess = function(data, conf, slack) {
    var passed = processChange(data, conf, slack);
    if (passed) {
        conf.presend = [];
        conf.override = setOverride(conf);
    } else {
        storeBefore(conf, data);
    }
};
module.exports.lineProcess = lineProcess;

var tailAway = function(conf) {
    console.log("Let the log watching begin");
    if (fileExists(conf.log)) {
        var Tail = require('tail').Tail;
        var tail = new Tail(conf.log);
        var slack = new Slack();
        tail.on("line", function(data) {
            lineProcess(data, conf, slack);
        });

        tail.on("error", function(error) {
            console.error(new Error('ERROR: ', error));
        });
    } else {
        console.error(new Error("Cannot see to file log file: '" + conf.log + "'."));
        return false;
    }
};

var go = function(configs) {
    console.log("Setting up");
    var conf = setupConf(configs);
    tailAway(conf);
};
module.exports.slack2log = go;

var ask = function() {
    var inquirer = require("inquirer");
    var questions = [{
        type: 'input',
        name: 'webhookUri',
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
        name: 'ignoreCase',
        message: 'Do you want to ignore case in your filter'
    }, {
        type: 'input',
        name: 'after',
        message: 'How many lines after the RegExp passes should be sent',
        default: 0
    }, {
        type: 'input',
        name: 'before',
        message: 'How many lines before the RegExp passes should be sent',
        default: 0
    }];

    return inquirer.prompt(questions);
};

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
        });
    }
};

start();
