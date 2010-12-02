'use strict'

var http = require('http')
,   mimeType = require('./mime').mimeType
,   fs =  require('promised-fs')
,   when = require('q').when
,   all = require('promised-utils').all
,   Registry = require('teleport/registry').Registry
,   Promised = require('promised-utils').Promised
,   Catalog = require('teleport/catalog').Catalog
,   activePackage = require('teleport/catalog/package').descriptor
,   CONST = require('teleport/strings')

,   server = http.createServer()
,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(CONST.TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()
,   playground = lib.join(CONST.TELEPORT_PLAYGROUND).read()
,   root = fs.Path(CONST.NPM_DIR)

var registry = Registry();

function getPackageName(path, active) {
  var components = path.split('/')
  if (components[1] === 'packages') return components[2]
  else activate
}

exports.activate = function activate() {
  return when
  ( activePackage()
  , function onFound(descriptor) {
      start(JSON.parse(descriptor).name)
    }
  , start.bind(null, 'teleport')
  )
}


function start(name) {
  server.listen(4747)
  console.log('Teleport is activated: http://localhost:4747/packages/' + name)
  server.on('request', function(request, response) {
    var path = request.url.split(CONST.EOP)[0]
    ,   index = path.indexOf(CONST.PACKAGES_URI_PATH)

    // If user has requested anything that is not under packages folder we
    // can't handle that so we should redirect to a packages/rest/of/path
    // instead.
    if (0 !== index && path !== '/packages') {
      response.writeHead(302, { 'Location': 'packages' + path })
      response.end()
    } else {
      console.log('>', path)
      var components = path.split('/')
        , packageName = components[2]
        , mime = mimeType(String(path))
        , document
        , id
        , pack

      path = components.slice(3).join('/')
      if ('' === path && 2 < components.length) path += 'index.html'

      console.log('package:', packageName)
      console.log('path:', path)

      if (packageName && path) {
        pack = registry.get('packages').get(packageName)
        // it's a module then
        if (0 === path.indexOf('packages/') && mime == 'application/javascript') {
          console.log('getModule:', path.substr(9, path.length - 9 - 3), 'package:', packageName)
          document = pack.invoke('getModuleTransport', [path.substr(9, path.length - 9 - 3)])
        } else {
          console.log('getContent:', path, 'package:', packageName)
          document = pack.invoke('getContent', [path])
        }
        when
        ( document
        , function onDocument(content) {
            response.writeHead(200, { 'Content-Type': mime })
            response.end(content)
          }
        , function onFailed(content) {
            response.writeHead(400)
            console.error(content)
            response.end(content.message)
          }
        )
      } else {
        response.writeHead(404)
        response.end('Not found')
      }
    }

    return;

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
    } else if (path == '/packages') {
      when
      ( root.list()
      , function(entries) {
          response.writeHead(200, { 'Content-Type': 'application/json' })
          registry = {}
          entries.forEach(function register(name) {
            if ('.' == name.charAt(0)) return
            registry[name] = path + '/' + name + '@active'
          })
          response.end(JSON.stringify(registry, null, 4))
        }
      , function(e) {
          response.writeHead(500)
          response.end(JSON.stringify({ error: String(e.message) }, null, 4))
        }
      )
    } else if (0 == index) {
      var id = path.substr(CONST.PACKAGES_URI_PATH.length)
      id = id.substr(0, id.length - 3)
      when(catalog.module(id).transport, function(moduleTransport) {
        response.writeHead(200, { 'Content-Type': 'text/javascript' })
        response.end(moduleTransport.toString())
      })
    } else {
      path = catalog.root.join(path)
      var mime = mimeType(String(path))
      when
      ( path.read()
      , function(content) {
          response.writeHead(200, { 'Content-Type': mime })
          response.end(content)
        }
      , function(e) {
          response.writeHead(404)
          when(playground, function(content) {
            response.end(content)
          })
        }
      )
    }
  })
}
