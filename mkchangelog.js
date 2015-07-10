#! /usr/bin/env node

///////////////////////////////////////////////////////////
// TODO: Insert names of branches and/or tags to compare
var before = 'v4.0.1';
var after = 'release/4.1';

// OPTIONAL: Set output filename
var filename = 'changelog.txt';
///////////////////////////////////////////////////////////

// Dependencies
var _ = require('lodash');
var cp = require('child_process');
var jsDiff = require('diff');
var fs = require('fs-extra');

// Format: "* Commit title (Abbreviated hash + link to commit)"
var command = 'git log --pretty=format:"* %s ([%h](https://github.com/winjs/winjs/commit/%H))"';

// Retrieve the commits for comparison
var beforeText = cp.execSync(command + ' ' + before).toString();
var afterText = cp.execSync(command + ' ' + after).toString();
var deltas = [];
var removed = [];

// Find the difference between commits
jsDiff.diffLines(beforeText, afterText).forEach(function (part) {
	// Log any discrepancies
	if (part.added || part.removed) {
		deltas.push(part.value);
	}
	// Specifically log the removed entries
	if (part.removed) {
		removed.push(part.value);
	}
});

// Split an array by new line
function getLines(array) {
	array = array.join('');
	return array.split(/\n+/);
}

// Get the description
function getDesc(string) {
	return _.result(string.match(/\* [\s\S]+?(?=\[\w+\])/), 0);
}

removed = getLines(removed);
deltas = getLines(deltas);

// Find any duplicate commits (i.e. commits with the same subject but different hash)
deltas = deltas.reduce(function(result, value) {
  var desc = getDesc(value);
  var matches = result.filter(function(other) {
    return getDesc(other) === desc;
  });

  return _.size(matches) > 1 ? _.difference(result, matches) : result;
}, deltas);

// Remove the duplicate commits
deltas = _.difference(deltas, removed);

// Output the commits to file
fs.outputFileSync(filename, deltas.join('\n'));
console.log('Generated file: ' + filename);
// console.log(deltas);