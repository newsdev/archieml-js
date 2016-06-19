(function() {
  var archieml = require('../archieml');
  var load = archieml.load;

  exports.freeformTests = function(test) {
    test.deepEqual(load('[+freeform]\nText'), {freeform: [{type: "text", "value": "Text"}]}, 'Text is added to freeforms when no trailing newline is present');

    test.done();
  };

  // Deprecated
  exports.loaderTests = function(test) {
    test.equal(load('key: value [comment] value').key, 'value [comment] value', 'comments are not removed when no comments option is specified');
    test.equal(load('key: value [comment] value', {}).key, 'value [comment] value', 'comments are not removed when a comment hash is passed without a comments option');
    test.equal(load('key: value [comment] value', {comments: false}).key, 'value [comment] value', 'comments are not removed when the comments option is set to false');
    test.equal(load('key: value [comment] value', {comments: true}).key, 'value  value', 'comments are removed when the comments option is set to true');
    test.equal(load('key: value [comment] value', {comments: 'true'}).key, 'value [comment] value', 'comments are not removed when the comments option is set to something other than a boolean');

    test.equal(load('key: value [[text]] value', {comments: 'true'}).key, 'value [[text]] value', 'double brackets are not collapased when the comments option is set to something other than a boolean');
    test.equal(load('key: value [[text]] value', {}).key, 'value [[text]] value', 'double brackets are not collapsed when a comment hash is passed without a comments option');
    test.equal(load('key: value [[text]] value', {comments: false}).key, 'value [[text]] value', 'double brackets are not collapsed when the comments option is set to false');
    test.equal(load('key: value [[text]] value', {comments: true}).key, 'value [text] value', 'double brackets are collapsed when the comments option is set to true');
    test.equal(load('key: value [[text]] value', {comments: 'true'}).key, 'value [[text]] value', 'double brackets are not collapsed when the comments option is set to something other than a boolean');

    test.done()
  };
}());
