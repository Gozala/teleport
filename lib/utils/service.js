'use strict'

var http = require('http')
,   mimeType = require('./mime').mimeType
,   fs =  require('promised-fs')
,   when = require('q').when
,   all = require('promised-utils').all
,   moduleUtils = require('./module')

,   server = http.createServer()

,   INDEX = 'index.html'
,   PACKAGES = '/packages/'
,   EOP = '?'
,   ROOT = '/'

exports.activate = function activate(root) {
  server.on('request', function(request, response) {
    var path = request.url.split(EOP)[0]
    ,   index = path.indexOf(PACKAGES)
    if (path == ROOT) path += INDEX
    if (0 == index) {
      var source = moduleUtils.transport(path.substr(PACKAGES.length))
      when(source, function(source) {
        response.writeHead(200, { 'Content-Type': 'text/javascript' })
        response.end(source)
      })
    } else {
      var content = fs.read(path = root + path)
      var mime = mimeType(path)
      when
      ( content
      , function(content) {
          response.writeHead(200, { 'Content-Type': mime })
          response.end(content)
        }
      , function(e) {
          response.writeHead(404)
          response.end()
        }
      )
    }
  })
  server.listen(4747)
}
