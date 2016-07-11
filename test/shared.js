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

            try {
              var metadata = load(test_aml, {comments: false}),
                  parsed   = load(test_aml);

              try {
                // Strip out reserved keys
                var message = metadata.test;
                var expected_result = JSON.parse(metadata.result);

                delete parsed['test'];
                delete parsed['result'];

                test.deepEqual(parsed, expected_result, slug + '.' + idx + ': ' + message);
              } catch(e) {
                console.log('JSON parsing error', slug + '.' + idx);
                console.log(parsed.result);
                console.log(e);
                test.ok(false, e);
              }

            } catch(e) {
              console.log('AML parsing error', slug + '.' + idx);
              console.log(test_aml);
              console.log(e);
              test.ok(false, e);
            }

          });
        });

        test.done();
      });
    });
  };

}());
