'use strict'

var markdown = require('markdown-js')
,   mustache = require('mustache')
,   http = require('promised-http')
,   q = require('q'), when = q.when
,   system = require('system')

exports.main = function main() {
  system.stdin.on('data', function(data) {
    var content = when(http.request('docs/' + data + '.md'), markdown.parse)
    ,   element = document.getElementById(data)
    when(content, function(content) { element.innerHTML = content })
  })
}

if (require.main == module) exports.main()
