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
,   parseURL = require('url').parse

,   server = http.createServer()
,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(CONST.TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()
,   playground = lib.join(CONST.TELEPORT_PLAYGROUND).read()
,   root = fs.Path(CONST.NPM_DIR)

var registry = Registry();


function isUnderPackages(path) {
  return 1 >= path.indexOf('packages/') && 10 < path.length
}

function redirectTo(url, response) {
  response.writeHead(302, { 'Location': url })
  response.end()
}

function makePackageRedirectURL(name, url) {
  var redirectURL = '/packages/' + name
  if (url !== '/packages' && url !== '/packages/') redirectURL += url
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

function getPackageName(path) {
  path = String(path).replace('/packages/', '')
  return path.substr(0, path.indexOf('/'))
}

function getPackageRelativePath(path, name) {
  var packageRoot = '/packages/'
  if (name) packageRoot += name
  return String(path).replace(packageRoot, '')
}

function isJSPath(path) {
  return '.js' === String(path).substr(-3)
}
function removeJSExtension(path) {
  return isJSPath(path) ? path.substr(0, path.length - 3) : path
}
function isModulePath(path) {
  return isUnderPackages(path) && isJSPath(path)
}

function getModuleId(path) {
  return removeJSExtension(getPackageRelativePath(path))
}
function getContentPath(path) {
  return String(path).substr(1)
}

function isTransportRequest(url) {
  return 0 <= String(url.search).indexOf('transport')
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
    var url = parseURL(request.url)
      , needToWrap = isTransportRequest(url)
      , path = url.pathname
      , normalizedPath = normalizePath(path)
      , index = path.indexOf(CONST.PACKAGES_URI_PATH)
      , relativePath
      , packageName
      , mime
      , content
      , pack

    // If user has requested anything that is not under packages folder we
    // can't handle that so we should redirect to a packages/rest/of/path
    // instead.
    if (!isUnderPackages(path))
      redirectTo(makePackageRedirectURL(name, normalizedPath), response)
    if (normalizedPath !== path) redirectTo(normalizedPath, response)
    else {
      packageName = getPackageName(path)
      relativePath = getPackageRelativePath(compeletPath(path), packageName)
      mime = mimeType(String(path))

      console.log('\nrequest:', path)

      if (packageName && relativePath) {
        pack = registry.get('packages').get(packageName)
        if (isModulePath(relativePath)) {
          console.log('module:', getModuleId(relativePath))
          var method = needToWrap ? 'getModuleTransport' : 'getModuleSource'
          content = pack.invoke(method, [getModuleId(relativePath)])
        } else {
          console.log('content:', getContentPath(relativePath))
          content = pack.invoke('getContent', [getContentPath(relativePath)])
        }
        when
        ( content
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
        response.end('Not found: ' + path)
      }
    }
  })
}
