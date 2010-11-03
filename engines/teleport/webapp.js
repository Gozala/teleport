'use strict'

var markdown = require('markdown-js')
,   mustache = require('mustache')
,   http = require('promised-http')
,   q = require('q'), when = q.when

exports.main = function main() {
  var intro = when(http.request('docs/introduction.md'), markdown.parse)
  when(intro, function(content) { document.getElementById('intro').innerHTML = content })
}

if (require.main == module) exports.main()
