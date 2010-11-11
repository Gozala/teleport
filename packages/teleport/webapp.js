define("teleport/webapp", ["markdown-js","promised-http","q","system"], function(require, exports, module, undefined) { 'use strict'

var markdown = require('markdown-js')
,   http = require('promised-http')
,   q = require('q'), when = q.when
,   system = require('system')

function load(data) {
  var content = when(http.request('docs/' + data + '.md'), markdown.parse)
  ,   element = document.getElementById(data)
  when(content, function(content) { element.innerHTML = content })
}

exports.main = function main() {
  system.stdin.on('data', load)
  if (window.location.hash) load(window.location.hash.substr(1))
}

if (require.main == module) exports.main()
 
/**/});