// LaunchBar Action Script
var SUGGESTIONS = [];
var UPDATED_AT = Date.now();

function run()
{
}

function buildSuggestion(title, subtitle, command) {
    return {
        'title' : title,
        'subtitle': subtitle,
        'icon' : 'ssh-icon.icns',
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
    var userHomeUrl = 'file:///Users/' + encodeURIComponent(LaunchBar.userName);
    var histories = [];

    try {
        histories.push(File.readText(File.pathForFileURL(userHomeUrl + '/.bash_history'), 'utf-8'));
    } catch(exception) {
        LaunchBar.log('Bash history not available: ' + exception);
    }

    try {
        histories.push(File.readText(File.pathForFileURL(userHomeUrl + '/.zsh_history'), 'ascii'));
    } catch(exception) {
        LaunchBar.log('ZSH history not available: ' + exception);
    }

    var history = histories.join('\n');

    var regex = RegExp(/(?:^|^:.*;)ssh (.*)/gm);
    var regexMatch = [];
    var commands = [];

    while((regexMatch = regex.exec(history)) !== null) {
        var command = regexMatch[1];
        commands.push(buildSuggestion(command, command, command));
    }

    return commands.reverse();
}

function updateIndex() {
    SUGGESTIONS = SUGGESTIONS.concat(sshFromShellHistories());
}

function runWithString(argument)
{
    if(Date.now() - UPDATED_AT > 300000) {
        updateIndex();
    }

    return SUGGESTIONS.filter(function(command) { return fuzzysearch(argument, command.actionArgument); });
}

function ssh(argument) {
    LaunchBar.openURL('ssh://' + argument);
}

updateIndex();
