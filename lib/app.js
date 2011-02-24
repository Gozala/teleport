'use strict'

var markdown = require('markdown-js')
var http = require('promised-http')
var q = require('q'), when = q.when
var system = require('system')

function load(data) {
  var content = http.request('docs/' + data + '.md')
  var element = document.getElementById(data)
  when(content, function(content) { 
    element.innerHTML = markdown.parse(content)
  }, function onError(reason) {
    console.error(reason)
  })
}

exports.main = function main() {
  system.stdin.on('data', load)
  if (window.location.hash) load(window.location.hash.substr(1))
}

if (require.main == module) exports.main()
