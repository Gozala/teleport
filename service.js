'use strict'

var http = require('http')
,   mimeType = require('mime').lookup
,   fs =  require('promised-fs')
,   when = require('q').when
,   all = require('promised-utils').all
,   Registry = require('./registry').Registry
,   Promised = require('promised-utils').Promised
,   getDescriptor = require('./project').getDescriptor
,   CONST = require('./strings')
,   parseURL = require('url').parse

,   server = http.createServer()
,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(CONST.TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()
,   deprecatedPath = 'packages/teleport.js'
,   newTeleportPath = 'support/teleport/teleport.js'
,   DEP_DIR = '/support/'

var registry = Registry();
var playground = registry.invoke('packages.teleport-dashboard.getContent'
                                , ['resources/pages/404.html'])


function isUnderPackages(path) {
  var index = path.indexOf('support/')
  return index >= 0 && index <= 1 && 10 < path.length
}

function redirectTo(url, response) {
  response.writeHead(302, { 'Location': url })
  response.end()
}

function makePackageRedirectURL(name, url) {
  var redirectURL = DEP_DIR + name
  if (url !== '/support' && url !== DEP_DIR) redirectURL += url
  return redirectURL
}

function isPathToFile(path) {
  return 0 <= String(path).substr(path.lastIndexOf('/') + 1).indexOf('.')
}
function compeletPath(path) {
  path = String(path)
  if (!isPathToFile(path)) {
    if ('/' !== path.charAt(path.length - 1)) path += '/'
    path += 'index.html'
  }
  return path
}
function normalizePath(path) {
  if (!isPathToFile(path) && '/' !== path.charAt(path.length - 1)) path += '/'
  return path
}

function stripOutDependenciesPath(path) {
  return 0 == path.indexOf(DEP_DIR) ? path.substr(DEP_DIR.length) : path

}
function getPackageName(path) {
  path = stripOutDependenciesPath(String(path))
  var parts = path.split('/')
  return parts[0] || parts[1]
}

function getPackageRelativePath(path, name) {
  path = stripOutDependenciesPath(String(path))
  if (name) path = path.substr(path.indexOf(name) + name.length)
  return path
}

function isJSPath(path) {
  return '.js' === String(path).substr(-3)
}
function removeJSExtension(path) {
  return isJSPath(path) ? path.substr(0, path.length - 3) : path
}
function isModuleRequest(url) {
  return 0 <= String(url.search).indexOf('module') && isJSPath(url.pathname)
}

function getModuleId(path, name) {
  var id = getPackageRelativePath(path, name)
  if (id == path) id = '.' + id
  else id = removeJSExtension(id)
  return id
}
function getContentPath(path) {
  return String(path).substr(1)
}

function isTransportRequest(url) {
  return 0 <= String(url.search).indexOf('transport')
}

function isRegistryRequest(url) {
  return url === '/registry.json'
}

function getPackageContentForPath(pack, path, packageName) {
  var content, name
  if (isUnderPackages(path)) {
    name = getPackageName(path)
    if (packageName !== name) pack = pack.get('dependencies').get(name)
    content = getPackageContentForPath(pack, getPackageRelativePath(path, name))
  } else {
    content = pack.invoke('getContent', [getContentPath(path)])
  }
  return content
}

exports.activate = function activate() {
  return when(getDescriptor().get("name"), start.bind(null),
              start.bind(null, 'teleport-dashboard'))
}


function start(name) {
  server.listen(4747)
  console.log('Teleport is activated: http://localhost:4747/' + name)
  server.on('request', function(request, response) {
    var url = parseURL(request.url)
      , needToWrap = isTransportRequest(url)
      , path = url.pathname
      , normalizedPath = normalizePath(path)
      , relativePath
      , packageName
      , mime
      , content
      , pack

    // If user has requested anything that is not under packages folder we
    // can't handle that so we should redirect to a packages/rest/of/path
    // instead.
    if (isRegistryRequest(path))
      content = registry.invoke('stringify', ['    '])
    // If request path does not ends with '/' and it's not request to file
    // we add trailing slash ourself, so that all browsers will generate to
    // correct relative paths.
    else if (normalizedPath !== path) redirectTo(normalizedPath, response)
    // If request path is just '/' then we don't have any package so we
    // redirect to default teleport-dashboard.
    else if (path == '/') redirectTo('/teleport-dashboard/', response)
    // Otherwise we detect package name and path of the file that is being
    // requested from that package.
    else {
      packageName = getPackageName(path)
      relativePath = getPackageRelativePath(compeletPath(path), packageName)
      mime = mimeType(String(relativePath))

      if (packageName && relativePath) {
        pack = registry.get('packages').get(packageName)
        if (isModuleRequest(url)) {
          var method = needToWrap ? 'getModuleTransport' : 'getModuleSource'
          content = pack.invoke(method, [getModuleId(relativePath)])
        // Module 'teleport' is deprecated, all the request to in in old format
        // are redirected to a new static file 'teleport/teleport.js'.
        } else if (relativePath.substr(1) == deprecatedPath) {
          redirectTo('/' + newTeleportPath, response)
          console.log('Usage of `' + deprecatedPath + '` is deprecated, please update your html to refer to `' + newTeleportPath + '` instead.')
        } else {
          content = getPackageContentForPath(pack, relativePath, packageName)
        }
      } else {
        response.writeHead(404)
        Promised.sync(response.end).call(response, playground)
      }
    }

    if (content) {
      when
      ( content
      , function onDocument(content) {
          response.writeHead(200, { 'Content-Type': mime })
          response.end(content)
        }
      , function onFailed(error) {
          response.writeHead(404)
          Promised.sync(response.end).call(response, playground)
        }
      )
    }
  })
}
