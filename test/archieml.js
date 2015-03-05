(function() {

  module('archieml');
  var load = archieml.load;

  test('parsing values', function() {
    equal(load('key:value').key, 'value', 'parses key value pairs');
    equal(load('  key  :value').key, 'value', 'ignores spaces on either side of the key');
    equal(load('\t\tkey\t\t:value').key, 'value', 'ignores tabs on either side of the key');
    equal(load('key:  value  ').key, 'value', 'ignores spaces on either side of the value');
    equal(load('key:\t\tvalue\t\t').key, 'value', 'ignores tabs on either side of the value');
    equal(load('key:value\nkey:newvalue').key, 'newvalue', 'dupliate keys are assigned the last given value');
    equal(load('key::value').key, ':value', 'allows non-letter characters at the start of values');

    deepEqual(Object.keys(load('key:value\nKey:Value')), ['key', 'Key'], 'keys are case sensitive');
    equal(load('other stuff\nkey:value\nother stuff').key, 'value', "non-keys don't affect parsing");
  });

  test('valid keys', function() {
    equal(load('a-_1:value')['a-_1'], 'value', 'letters, numbers, dashes and underscores are valid key components');
    equal(Object.keys(load('k ey:value')).length, 0, 'spaces are not allowed in keys');
    equal(Object.keys(load('k&ey:value')).length, 0, 'symbols are not allowed in keys');
    equal(load('scope.key:value').scope.key, 'value', 'keys can be nested using dot-notation');
    equal(load('scope.key:value\nscope.otherkey:value').scope.key, 'value', "earlier keys within scopes aren't deleted when using dot-notation");
    deepEqual(load('scope.level:value\nscope.level.level:value').scope.level.level, 'value', 'the value of key that used to be a parent object should be replaced with a string if necessary');
    equal(load('scope.level.level:value\nscope.level:value').scope.level, 'value', 'the value of key that used to be a string object should be replaced with an object if necessary');
  });

  test('valid values', function() {
    equal(load('key:<strong>value</strong>').key, '<strong>value</strong>', 'HTML is allowed');
  });

  test('skip', function() {
    equal(Object.keys(load('  :skip  \nkey:value\n:endskip')).length, 0, 'ignores spaces on either side of :skip');
    equal(Object.keys(load('\t\t:skip\t\t\nkey:value\n:endskip')).length, 0, 'ignores tabs on either side of :skip');
    equal(Object.keys(load(':skip\nkey:value\n  :endskip  ')).length, 0, 'ignores spaces on either side of :endskip');
    equal(Object.keys(load(':skip\nkey:value\n\t\t:endskip\t\t')).length, 0, 'ignores tabs on either side of :endskip');

    equal(Object.keys(load(':skip\n:endskip\nkey:value')).length, 1, 'starts parsing again after :endskip');
    equal(Object.keys(load(':sKiP\nkey:value\n:eNdSkIp')).length, 0, ':skip and :endskip are case insensitive');

    equal(Object.keys(load(':skipthis\nkey:value\n:endskip')).length, 0, "parse :skip as a special command even if more is appended to word");
    equal(Object.keys(load(':skip this text  \nkey:value\n:endskip')).length, 0, 'ignores all content on line after :skip + space');
    equal(Object.keys(load(':skip\tthis text\t\t\nkey:value\n:endskip')).length, 0, 'ignores all content on line after :skip + tab');

    equal(Object.keys(load(':skip\n:endskiptheabove\nkey:value')).length, 1, "parse :endskip as a special command even if more is appended to word");
    equal(Object.keys(load(':skip\n:endskip the above\nkey:value')).length, 1, 'ignores all content on line after :endskip + space');
    equal(Object.keys(load(':skip\n:endskip\tthe above\nkey:value')).length, 1, 'ignores all content on line after :endskip + tab');
    equal(Object.keys(load(':skip\n:end\tthe above\nkey:value')).length, 0, 'does not parse :end as an :endskip');

    deepEqual(Object.keys(load('key1:value1\n:skip\nother:value\n\n:endskip\n\nkey2:value2')), ['key1', 'key2'], 'ignores keys within a skip block');
  });

  test('ignore', function() {
    equal(load('key:value\n:ignore').key, 'value', "text before ':ignore' should be included");
    equal(load(':ignore\nkey:value').key, undefined, "text after ':ignore' should be ignored");
    equal(load(':iGnOrE\nkey:value').key, undefined, "':ignore' is case insensitive");
    equal(load('  :ignore  \nkey:value').key, undefined, "ignores spaces on either side of :ignore");
    equal(load('\t\t:ignore\t\t\nkey:value').key, undefined, "ignores tabs on either side of :ignore");
    equal(load(':ignorethis\nkey:value').key, undefined, "parses :ignore as a special command even if more is appended to word");
    equal(load(':ignore the below\nkey:value').key, undefined, "ignores all content on line after :ignore + space");
    equal(load(':ignore\tthe below\nkey:value').key, undefined, "ignores all content on line after :ignore + tab");
  });

  test('multi line values', function() {
    equal(load('key:value\nextra\n:end').key, 'value\nextra', 'adds additional lines to value if followed by an \':end\'');
    equal(load('key:value\nextra\n:EnD').key, 'value\nextra', '\':end\' is case insensitive');
    equal(load('key:value\n\n\t \nextra\n:end').key, 'value\n\n\t \nextra', 'preserves blank lines and whitespace lines in the middle of content');
    equal(load('key:value\nextra\t \n:end').key, 'value\nextra', "doesn't preserve whitespace at the end of the key");
    equal(load('key:value\t \nextra\n:end').key, 'value\t \nextra', 'preserves whitespace at the end of the original line');

    equal(load('key:value\nextra\n \n\t\n:end').key, 'value\nextra', 'ignores whitespace and newlines before the \':end\'');
    equal(load('key:value\nextra\n  :end  ').key, 'value\nextra', 'ignores spaces on either side of :end');
    equal(load('key:value\nextra\n\t\t:end\t\t').key, 'value\nextra', 'ignores tabs on either side of :end');

    equal(load('key:value\nextra\n:endthis').key, 'value\nextra', "parses :end as a special command even if more is appended to word");
    equal(load('key:value\nextra\n:endskip').key, 'value', "does not parse :endskip as an :end");
    equal(load('key:value\n:notacommand\n:end').key, 'value\n:notacommand', "ordinary text that starts with a colon is included");
    equal(load('key:value\nextra\n:end this').key, 'value\nextra', "ignores all content on line after :end + space");
    equal(load('key:value\nextra\n:end\tthis').key, 'value\nextra', "ignores all content on line after :end + tab");

    equal(load('key::value\n:end').key, ':value', "doesn't escape colons on first line");
    equal(load('key:\\:value\n:end').key, '\\:value', "doesn't escape colons on first line");
    equal(load('key:value\nkey2\\:value\n:end').key, 'value\nkey2\\:value', 'does not allow escaping keys');
    equal(load('key:value\n\\key2:value\n:end').key, 'value\nkey2:value', 'allows escaping key lines with a leading backslash');
    equal(load('key:value\n\\:end\n:end').key, 'value\n:end', 'allows escaping commands at the beginning of lines');
    equal(load('key:value\n\\:endthis\n:end').key, 'value\n:endthis', 'allows escaping commands with extra text at the beginning of lines');
    equal(load('key:value\n\\:notacommand\n:end').key, 'value\n:notacommand', 'allows escaping of non-commands at the beginning of lines');

    equal(load('key:value\n* value\n:end').key, 'value\n* value', 'allows simple array style lines');
    equal(load('key:value\n\\* value\n:end').key, 'value\n* value', 'escapes "*" within multi-line values when not in a simple array');

    equal(load('key:value\n\\{scope}\n:end').key, 'value\n{scope}', 'allows escaping {scopes} at the beginning of lines');
    equal(load('key:value\n\\[comment]\n:end').key, 'value', 'allows escaping [comments] at the beginning of lines');
    equal(load('key:value\n\\[[array]]\n:end').key, 'value\n[array]', 'allows escaping [[arrays]] at the beginning of lines');

    equal(load('key:value\n\\\\:end\n:end').key, 'value\n\\:end', 'allows escaping initial backslash at the beginning of lines');
    equal(load('key:value\n\\\\\\:end\n:end').key, 'value\n\\\\:end', 'escapes only one initial backslash');

    equal(load('key:value\nLorem key2\\:value\n:end').key, 'value\nLorem key2\\:value', "doesn't escape colons after beginning of lines");
  });

  test('scopes', function() {
    equal(typeof load('{scope}').scope, 'object', '{scope} creates an empty object at "scope"');
    notEqual(load('  {scope}  ').scope, undefined, 'ignores spaces on either side of {scope}');
    notEqual(load('\t\t{scope}\t\t').scope, undefined, 'ignores tabs on either side of {scope}');
    notEqual(load('{  scope  }').scope, undefined, 'ignores spaces on either side of {scope} variable name');
    notEqual(load('{\t\tscope\t\t}').scope, undefined, 'ignores tabs on either side of {scope} variable name');
    notEqual(load('{scope}a').scope, undefined, 'ignores text after {scope}');

    equal(load('key:value\n{scope}').key, 'value', 'items before a {scope} are not namespaced');
    equal(load('{scope}\nkey:value').scope.key, 'value', 'items after a {scope} are namespaced');
    equal(load('{scope.scope}\nkey:value').scope.scope.key, 'value', 'scopes can be nested using dot-notaion');
    equal(Object.keys(load('{scope}\nkey:value\n{}\n{scope}\nother:value').scope).length, 2, 'scopes can be reopened');
    equal(load('{scope.scope}\nkey:value\n{scope.otherscope}key:value').scope.scope.key, 'value', 'scopes do not overwrite existing values');

    equal(load('{scope}\n{}\nkey:value').key, 'value', '{} resets to the global scope');
    equal(load('{scope}\n{  }\nkey:value').key, 'value', 'ignore spaces inside {}');
    equal(load('{scope}\n{\t\t}\nkey:value').key, 'value', 'ignore tabs inside {}');
    equal(load('{scope}\n  {}  \nkey:value').key, 'value', 'ignore spaces on either side of {}');
    equal(load('{scope}\n\t\t{}\t\t\nkey:value').key, 'value', 'ignore tabs on either side of {}');
  });

  test('arrays', function() {
    equal(load('[array]').array.length, 0, '[array] creates an empty array at "array"');
    notEqual(load('  [array]  ').array, undefined, 'ignores spaces on either side of [array]');
    notEqual(load('\t\t[array]\t\t').array, undefined, 'ignores tabs on either side of [array]');
    notEqual(load('[  array  ]').array, undefined, 'ignores spaces on either side of [array] variable name');
    notEqual(load('[\t\tarray\t\t]').array, undefined, 'ignores tabs on either side of [array] variable name');
    notEqual(load('[array]a').array, undefined, 'ignores text after [array]');

    equal(load('[scope.array]').scope.array.length, 0, 'arrays can be nested using dot-notaion');

    deepEqual(load('[array]\nscope.key: value\nscope.key: value').array, [{'scope': {'key': 'value'}}, {'scope': {'key': 'value'}}], 'array values can be nested using dot-notaion');

    equal(load('[array]\n[]\nkey:value').key, 'value', '[] resets to the global scope');
    equal(load('[array]\n[  ]\nkey:value').key, 'value', 'ignore spaces inside []');
    equal(load('[array]\n[\t\t]\nkey:value').key, 'value', 'ignore tabs inside []');
    equal(load('[array]\n  []  \nkey:value').key, 'value', 'ignore spaces on either side of []');
    equal(load('[array]\n\t\t[]\t\t\nkey:value').key, 'value', 'ignore tabs on either side of []');
  });

  test('simple arrays', function() {
    equal(load('[array]\n*Value').array[0], 'Value', 'creates a simple array when an \'*\' is encountered first');
    equal(load('[array]\n  *  Value').array[0], 'Value', 'ignores spaces on either side of \'*\'');
    equal(load('[array]\n\t\t*\t\tValue').array[0], 'Value', 'ignores tabs on either side of \'*\'');
    equal(load('[array]\n*Value1\n*Value2').array.length, 2, 'adds multiple elements');
    deepEqual(load('[array]\n*Value1\nNon-element\n*Value2').array, ["Value1", "Value2"], 'ignores all other text between elements');
    deepEqual(load('[array]\n*Value1\nkey:value\n*Value2').array, ["Value1", "Value2"], 'ignores key:value pairs between elements');
    equal(load('[array]\n*Value1\n[]\nkey:value').key, "value", 'parses key:values normally after an end-array');

    equal(load('[array]\n*Value1\nextra\n:end').array[0], "Value1\nextra", 'multi-line values are allowed');
    equal(load('[array]\n*Value1\n\\* extra\n:end').array[0], "Value1\n* extra", 'allows escaping of "*" within multi-line values in simple arrays');
    equal(load('[array]\n*Value1\n\\:end\n:end').array[0], "Value1\n:end", 'allows escaping of command keys within multi-line values');
    equal(load('[array]\n*Value1\nkey\\:value\n:end').array[0], "Value1\nkey\\:value", 'does not allow escaping of keys within multi-line values');
    equal(load('[array]\n*Value1\n\\key:value\n:end').array[0], "Value1\nkey:value", 'allows escaping key lines with a leading backslash');
    equal(load('[array]\n*Value1\nword key\\:value\n:end').array[0], "Value1\nword key\\:value", 'does not allow escaping of colons not at the beginning of lines');

    equal(load('[array]\n*Value\n[]\n[array]\n*Value').array.length, 2, 'arrays that are reopened add to existing array');
    deepEqual(load('[array]\n*Value\n[]\n[array]\nkey:value').array, ["Value"], 'simple arrays that are reopened remain simple');
  });

  test('complex arrays', function() {
    equal(load('[array]\nkey:value').array[0].key, 'value', 'keys after an [array] are included as items in the array');
    equal(load('[array]\nkey:value\nsecond:value').array[0].second, 'value', 'array items can have multiple keys');
    equal(load('[array]\nkey:value\nsecond:value\nkey:value').array.length, 2, 'when a duplicate key is encountered, a new item in the array is started');
    equal(load('[array]\nkey:first\nkey:second').array[1].key, 'second', 'when a duplicate key is encountered, a new item in the array is started');
    equal(load('[array]\nscope.key:first\nscope.key:second').array[1].scope.key, 'second', 'when a duplicate key is encountered, a new item in the array is started');

    equal(load('[array]\nkey:value\nscope.key:value').array.length, 1, 'duplicate keys must match on dot-notation scope');
    equal(load('[array]\nscope.key:value\nkey:value\notherscope.key:value').array.length, 1, 'duplicate keys must match on dot-notation scope');

    equal(load('[array]\nkey:value\n[]\n[array]\nkey:value').array.length, 2, 'arrays that are reopened add to existing array');
    deepEqual(load('[array]\nkey:value\n[]\n[array]\n*Value').array, [{"key": "value"}], 'complex arrays that are reopened remain complex');
  });

  test('inline comments', function() {
    equal(load('key:value [inline comments] value').key, 'value  value', 'ignore comments inside of [single brackets]');
    equal(load('key:value [inline comments] value [inline comments] value').key, 'value  value  value', 'supports multiple inline comments on a single line');
    equal(load('key:value [inline comments] [inline comments] value').key, 'value   value', 'supports adjacent comments');
    equal(load('key:value [inline comments][inline comments] value').key, 'value  value', 'supports no-space adjacent comments');
    equal(load('key:[inline comments] value').key, 'value', 'supports comments at beginning of string');
    equal(load('key:value [inline comments]').key, 'value', 'supports comments at end of string');
    equal(load('key:value [inline comments] value [inline comments]').key, 'value  value', 'whitespace before a comment that appears at end of line is ignored');

    equal(load('key:value ][ value').key, 'value ][ value', 'unmatched single brackets are preserved');
    equal(load('key:value [inline comments] on\nmultiline\n:end').key, 'value  on\nmultiline', 'inline comments are supported on the first of multi-line values');
    equal(load('key:value\nmultiline [inline comments]\n:end').key, 'value\nmultiline', 'inline comments are supported on subsequent lines of multi-line values');

    equal(load('key: [] value [] \n multiline [] \n:end').key, 'value  \n multiline', 'whitespace around comments is preserved, except at the beinning and end of a value');

    equal(load('key:value [inline\ncomments] value\n:end').key, 'value [inline\ncomments] value', 'inline comments cannot span multiple lines');
    equal(load('key:value \n[inline\ncomments] value\n:end').key, 'value \n[inline\ncomments] value', 'inline comments cannot span multiple lines');

    equal(load('key:value [[brackets]] value').key, 'value [brackets] value', 'text inside [[double brackets]] is included as [single brackets]');
    equal(load('key:value ]][[ value').key, 'value ]][[ value', 'unmatched double brackets are preserved');

    equal(load('[array]\n*Val[comment]ue').array[0], 'Value', 'comments work in simple arrays');
    equal(load('[array]\n*Val[[real]]ue').array[0], 'Val[real]ue', 'double brackets work in simple arrays');
  });

}());
