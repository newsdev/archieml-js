(function() {

  var fs = require('fs'),
      archieml = require('../archieml'),
      queue = require('queue-async');
  var load = archieml.load;

  var q = queue(1);
  var tests = {};
  var shared_dir = 'test/archieml.org/test/1.0/';

  var deferWrapper = function(dir, cb) {
    return fs.readFile(dir, function(error, data) {
      cb(error, [data, dir]);
    });
  }

  exports.sharedTests = function(test) {
    fs.readdir(shared_dir, function (err, files) {

      files.forEach(function(file) {
        q.defer(deferWrapper, shared_dir + file);
      });

      q.awaitAll(function(error, results) {
        results.forEach(function(result){
          var data = result[0];
          var match = result[1].match(/\/(\w+\.\d+).aml$/);
          if (!match) return;

          file = match[1];

          var category = file.split('.')[0];
          var idx      = parseInt(file.split('.')[1]);

          tests[category] = tests[category] || {};
          tests[category][idx] = data;
        });

        Object.keys(tests).forEach(function(slug) {
          Object.keys(tests[slug]).forEach(function(idx){
            var test_aml = tests[slug][idx].toString('utf8');
            // Brackets in the "result" value need to be replaced with double
            // brackets before parsing, since inline comments aren't currently
            // optional. Match only brackets within quotes.
            test_aml = test_aml.replace(/^result: (.*)$/m, function(result) {
              return result.replace(/\[([^\[\]\n\r]*)\]/g, "[[$1]]")
            });

            try {
              var parsed = load(test_aml);

              try {
                // Strip out reserved keys
                var message = parsed.test;
                var expected_result = JSON.parse(parsed.result);

                delete parsed['test'];
                delete parsed['result'];

                test.deepEqual(parsed, expected_result, slug + '.' + idx + ': ' + message);
              } catch(e) {
                console.log('JSON parsing error', slug + '.' + idx)
                console.log(parsed.result);
                console.log(e);
              }

            } catch(e) {
              console.log('AML parsing error', slug + '.' + idx)
              console.log(test_aml);
              console.log(e);
            }

          });
        });

        test.done();
      });
    });
  };

}());
