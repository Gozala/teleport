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
,   TELEPORT = PACKAGES + 'teleport.js'
,   EOP = '?'
,   ROOT = '/'

var lib = fs.path(module.filename).directory().directory()
,   core = lib.join('teleport.js').read()
,   engine = lib.join('engine','teleport-service.js').read()

exports.activate = function activate(root) {
  server.on('request', function(request, response) {
    var path = request.url.split(EOP)[0]
    ,   index = path.indexOf(PACKAGES)
    if (path == ROOT) path += INDEX
    if (path == TELEPORT) {
      response.writeHead(200, { 'Content-Type': 'text/javascript' })
      when
      ( all([core, engine])
      , function(content) {
          response.end(content.join('\n'))
        }
      , console.error
      )
    } else if (0 == index) {
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
