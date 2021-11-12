# ArchieML

Parse Archie Markup Language (ArchieML) documents into JavaScript objects.

Read about the ArchieML specification at [archieml.org](http://archieml.org).

The current version is `v0.5.0`.

## Installation

`npm install archieml`

## Usage

```
<script src="archieml.js"></script>

<script type="text/javascript">
  var parsed = archieml.load("key: value");
  >> {"key": "value"}
</script>
```

```
var archieml = require('archieml');
var parsed = archieml.load("key: value");
>> {"key": "value"}
```

### Parser options

Inline comments are now deprecated in ArchieML. They will continue to be supported until 1.0, but are now disabled by default. They can be enabled by passing an options object as the second parameter in `load`:

```
archieml.load("key: value [comment]");
>> {"key": "value [comment]"}

archieml.load("key: value [comment]", {comments: true});
>> {"key": "value"}
```

### Using with Google Documents

We use `archieml` at The New York Times to parse Google Documents containing AML. This requires a little upfront work to download the document and convert it into text that `archieml` can load.

The first step is authenticating with the Google Drive API, and accessing the document. For this, you will need a user account that is authorized to view the document you wish to download.

For this example, I'm going to use a simple node app using Google's official `googleapis` npm package, but you can use another library or authentication method if you like. Whatever mechanism, you'll need to be able to export the document either as text, or html, and then run some of the post-processing listed in the example file at [`examples/google_drive.js`](https://github.com/newsdev/archieml-js/blob/master/examples/google_drive.js).

You will need to set up a Google API application in order to authenticate yourself. Full instructions are available [here](https://developers.google.com/accounts/docs/OpenIDConnect#appsetup). When you create your Client ID, you should list `http://127.0.0.1:3000` as an authorized origin, and `http://127.0.0.1:3000/oauth2callback` as the callback url.

Then open up `examples/google_drive.js` and enter the CLIENT_ID and CLIENT_SECRET from the API account you created. And then run the server:

```
$ npm install archieml
$ npm install express
$ npm install googleapis
$ npm install htmlparser2
$ npm install html-entities

$ node examples/google_drive.js
```

You should then be able to go to `http://127.0.0.1/KEY`, where `KEY` is the file id of the Google Drive document you want to parse. Make sure that the account you created has access to that document.

You can use a test document to start that's public to everyone. It will ask you to authenticate your current session, and then will return back a json representation of the document. View the source of                            [`examples/google_drive.js`](https://github.com/newsdev/archieml-js/blob/master/examples/google_drive.js) for step by step instructions on what's being done.

[`http://127.0.0.1:3000/1JjYD90DyoaBuRYNxa4_nqrHKkgZf1HrUj30i3rTWX1s`](http://127.0.0.1:3000/1JjYD90DyoaBuRYNxa4_nqrHKkgZf1HrUj30i3rTWX1s)

## Tests

A full shared test suite is included from the [archieml.org](https://github.com/newsdev/archieml.org) repository, under `/test`. After running `npm install`, initialize the shared test submodules (`git submodule init && git submodule update`) and  `npm run test` to execute the tests.

## Changelog

* `0.5.0` - Added support for implicit object nesting.
* `0.4.2` - Fixes bug #19.
* `0.4.1` - Fixes bug #21.
* `0.4.0` - Updates to how dot-notation is handled in freeform array, unicode key support.
* `0.3.1` - Added support for freeform arrays.
* `0.3.0` - Added support for nested arrays. Follows modifications in ArchieML [CR-20150509](http://archieml.org/spec/1.0/CR-20150509.html).
* `0.2.0` - Arrays that are redefined now overwrite the previous definition. Skips within multi-line values break up the value. Follows modifications in ArchieML [CR-20150306](http://archieml.org/spec/1.0/CR-20150423.html).
* `0.1.2` - More consistent handling of newlines. Fixes issue #4, around detecting the scope of multi-line values.
* `0.1.1` - Fixes issue #1, removing comment backslashes.
* `0.1.0` - Initial release supporting the first version of the ArchieML spec, published [2015-03-06](http://archieml.org/spec/1.0/CR-20150306.html).
