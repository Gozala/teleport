'use strict'

var http = require('http')
,   mimeType = require('./mime').mimeType
,   fs =  require('promised-fs')
,   when = require('q').when
,   all = require('promised-utils').all
,   moduleUtils = require('./module')
,   CONST = require('teleport/strings')

,   server = http.createServer()
,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(CONST.TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()

exports.activate = function activate(root) {
  server.on('request', function(request, response) {
    var path = request.url.split(CONST.EOP)[0]
    ,   index = path.indexOf(CONST.PACKAGES_URI_PATH)
    if (path == CONST.ROOT_URI) path += CONST.INDEX_FILE
    if (path == CONST.TELEPORT_URI_PATH) {
      response.writeHead(200, { 'Content-Type': 'text/javascript' })
      when
      ( all([core, engine])
      , function(content) {
          response.end(content.join(CONST.TELEPORT_JOIN_STR))
        }
      , console.error
      )
    } else if (0 == index) {
      var path = path.substr(CONST.PACKAGES_URI_PATH.length)
      when(moduleUtils.transport(path), function(source) {
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
