
var vows = require('vows'),
    archieml = require('../archieml'),
    assert = require('assert'),
    fs = require('fs'),
    glob = require('glob');

var tests = {};

glob.sync(__dirname + '/test-documents/*.aml').forEach(function(f) {

    var key = f.substring(f.lastIndexOf('/')+1, f.length-4).replace(/\-/g, ' ');

    tests[key] = {
        topic: function() { return archieml.load(fs.readFileSync(f, 'utf-8')); },
        'matches json': function(topic) {
            var expected = JSON.parse(fs.readFileSync(f.replace('.aml', '.json'), 'utf-8'));
            assert.deepEqual(topic, expected);
        }
    };

});

vows.describe('Parsing a bunch of test documents')
    .addBatch(tests)
    .exportTo(module);