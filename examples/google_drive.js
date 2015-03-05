#!/usr/bin/env node

var CLIENT_ID="";
var CLIENT_SECRET="";

var express = require('express');
var archieml = require('../archieml.js');
var app = express();
var url = require('url');
var htmlparser = require('htmlparser2');
var Entities = require('html-entities').AllHtmlEntities;

// Grab google packages and the drive api
var google = require('googleapis');
var drive = google.drive('v2');

// Set up auth
var OAuth2 = google.auth.OAuth2;
var oauth2Client = new OAuth2(CLIENT_ID, CLIENT_SECRET, "http://127.0.0.1:3000/oauth2callback");
google.options({ auth: oauth2Client });
var KEY = '1JjYD90DyoaBuRYNxa4_nqrHKkgZf1HrUj30i3rTWX1s';

app.get('/oauth2callback', function (req, res) {
  res.type('json');
  var code = url.parse(req.url, true).query.code;
  oauth2Client.getToken(code, function(err, tokens) {
    if(!err) {
      oauth2Client.setCredentials(tokens);

      request = drive.files.get({fileId: KEY}, function (err, doc) {
        if (err) return res.send(err)
        // There are the URLs for two versions of the exported document body:
        // plain text which is fine for simple parsing, and html which is
        // useful if we want to preserve links in the source document (see below).

        // Parse the document as Text
        // export_link = doc.exportLinks['text/plain'];
        // oauth2Client._makeRequest({method: "GET", uri: export_link}, function(err, body) {
        //   var parsed = archieml.load(body);

        //   res.type('json');
        //   res.send(parsed);
        // });


        // Parse the document as HTML
        //
        // There are a few extra steps that we do to make working with Google
        // Documents more useful. With a little more prep, we generally process
        // the documents to:
        //
        //   * Include links that users enter in the google document as HTML
        //     `<a>` tags
        //   * Remove smart quotes inside tag brackets `<>` (which Google loves
        //     to add for you)
        //   * Ensure that list bullet points are turned into `*`s
        //
        // Unfortunately, google strips out links when you export as `text/plain`,
        // so if you want to preserve them, we have to export the document in a
        // different format, `text/html`.

        export_link = doc.exportLinks['text/html'];
        oauth2Client._makeRequest({method: "GET", uri: export_link}, function(err, body) {

          var handler = new htmlparser.DomHandler(function(error, dom) {
            var tagHandlers = {
              _base: function (tag) {
                var str = '';
                tag.children.forEach(function(child) {
                  if (func = tagHandlers[child.name || child.type]) str += func(child);
                });
                return str;
              },
              text: function (textTag) { 
                return textTag.data; 
              },
              span: function (spanTag) {
                return tagHandlers._base(spanTag);
              },
              p: function (pTag) { 
                return tagHandlers._base(pTag) + '\n'; 
              },
              a: function (aTag) {
                var href = aTag.attribs.href;
                if (href === undefined) return '';

                // extract real URLs from Google's tracking
                // from: http://www.google.com/url?q=http%3A%2F%2Fwww.nytimes.com...
                // to: http://www.nytimes.com...
                if (aTag.attribs.href && url.parse(aTag.attribs.href,true).query && url.parse(aTag.attribs.href,true).query.q) {
                  href = url.parse(aTag.attribs.href,true).query.q;
                }

                var str = '<a href="' + href + '">';
                str += tagHandlers._base(aTag);
                str += '</a>';
                return str;
              },
              li: function (tag) {
                return '* ' + tagHandlers._base(tag) + '\n';
              }
            };

            ['ul', 'ol'].forEach(function(tag) {
              tagHandlers[tag] = tagHandlers.span;
            });
            ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach(function(tag) {
              tagHandlers[tag] = tagHandlers.p;
            });

            var body = dom[0].children[1];
            var parsedText = tagHandlers._base(body);

            // Convert html entities into the characters as they exist in the google doc
            var entities = new Entities();
            parsedText = entities.decode(parsedText);

            // Remove smart quotes from inside tags
            parsedText = parsedText.replace(/<[^<>]*>/g, function(match){
              return match.replace(/”|“/g, '"').replace(/‘|’/g, "'");
            });

            var parsed = archieml.load(parsedText);
            res.send(parsed);
          });

          var parser = new htmlparser.Parser(handler);

          parser.write(body);
          parser.done();
        });
      });
    }
  });
});

app.get('/:key', function (req, res) {
  var redirect_url = oauth2Client.generateAuthUrl({
    scope: 'https://www.googleapis.com/auth/drive'
  });
  res.redirect(redirect_url);
})

app.param('key', function (req, res, next, key) {
  KEY = key || KEY;
  next();
})


var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});
