// LaunchBar Action Script
var SUGGESTIONS = [];
var UPDATED_AT = Date.now();
var USER_HOME_URL = 'file:///Users/' + encodeURIComponent(LaunchBar.userName);

function run()
{
}

function buildSuggestion(title, subtitle, command, icon) {
    return {
        'title' : title,
        'subtitle': subtitle,
        'icon' : icon,
        'action': 'ssh',
        'actionArgument': command,
        'actionRunsInBackground': false,
        'actionReturnsItems': false,
        'alwaysShowsSubtitle': true
    }
}

// Stole this from https://github.com/bevacqua/fuzzysearch
function fuzzysearch (needle, haystack) {
    var hlen = haystack.length;
    var nlen = needle.length;
    if (nlen > hlen) {
        return false;
    }
    if (nlen === hlen) {
        return needle === haystack;
    }
    outer: for (var i = 0, j = 0; i < nlen; i++) {
        var nch = needle.charCodeAt(i);
        while (j < hlen) {
            if (haystack.charCodeAt(j++) === nch) {
                continue outer;
            }
        }
        return false;
    }
    return true;
}

function sshFromShellHistories() {
    var histories = [];

    try {
        histories.push(File.readText(File.pathForFileURL(USER_HOME_URL + '/.bash_history'), 'utf-8'));
    } catch(exception) {
        LaunchBar.log('Bash history not available: ' + exception);
    }

    try {
        histories.push(File.readText(File.pathForFileURL(USER_HOME_URL + '/.zsh_history'), 'ascii'));
    } catch(exception) {
        LaunchBar.log('ZSH history not available: ' + exception);
    }

    var history = histories.join('\n');

    var regex = RegExp(/(?:^|^:.*;)ssh (.*)/gm);
    var regexMatch = [];
    var commands = [];

    while((regexMatch = regex.exec(history)) !== null) {
        var command = regexMatch[1];
        commands.push(buildSuggestion(command, command, command, 'ssh-icon.icns'));
    }

    return commands.reverse();
}

function sshFromConfig() {
    var config = "";

    try {
        config = File.readText(File.pathForFileURL(USER_HOME_URL + '/.ssh/config'), 'utf-8');
    } catch(exception) {
        LaunchBar.log('.ssh/config not available: ' + exception);
    }

    var regex = RegExp(/Host (.*)\n/gm);
    var regexMatch = [];
    var commands = [];

    while((regexMatch = regex.exec(config)) !== null) {
        var command = regexMatch[1];
        commands.push(buildSuggestion(command, command, command, 'ssh-icon-fav.icns'));
    }

    return commands;
}

function updateIndex() {
    SUGGESTIONS = [].concat(sshFromConfig(), sshFromShellHistories());
}

function runWithString(argument)
{
    if(Date.now() - UPDATED_AT > 300000) {
        updateIndex();
    }

    return SUGGESTIONS.filter(function(command) { return fuzzysearch(argument, command.actionArgument); });
}

function ssh(argument) {
    LaunchBar.performAction('Run iTerm Command', 'ssh ' + argument);
}

updateIndex();
