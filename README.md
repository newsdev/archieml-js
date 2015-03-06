# archieml

Parse Archie Markup Language (ArchieML) documents into JavaScript objects.

Read about the ArchieML specification at [archieml.org](http://archieml.org).

The current version is `v0.1.0`.

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

There is a full test suite under the `test/` directory. Simply open up `test/index.html` in a web browser to run it.

```
rspec
```

## Changelog

* `0.1.0` - Initial release supporting the first version of the ArchieML spec, published [2015-03-06](http://archieml.org/spec/1.0/CR-20150306.html).
