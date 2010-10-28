'use strict'

var http = require('http')
    mimeType = require('./mime').mimeType
    fs =  require('fs')
    moduleUtils = require('./module')

,   server = http.createServer()

,   INDEX = 'index.html'
,   PACKAGES = '/packages'
,   EOP = '?'
,   ROOT = '/'

exports.activate = function activate(root) {
  server.on('request', function(request, response) {
    var path = request.url.split(EOP)[0]
    ,   index = path.indexOf(PACKAGES)
    if (path == ROOT) path += INDEX
    if (0 == index) {
      module.transport(path.substr(++index), function(e, data) {
        if (e) response.writeHead(404)
        else {
          response.writeHead(200, { 'Content-Type': 'text/javascript' })
          response.write(data)
        }
        response.end()
      })
    } else {
      path = root + path
      fs.readFile(path, function(e, data) {
        if (e) response.writeHead(404) 
        else {
          response.writeHead(200, { 'Content-Type': mimeType(path) })
          response.write(data)
        }
        response.end()
      })
    }
  })
  server.listen(4747)
}
