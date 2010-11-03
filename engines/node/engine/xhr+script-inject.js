define('teleport/engine', function(require, exports, module, undefined) {
  'use strict'
  
  var teleport = require('teleport/core')
  
  ,   factories = teleport.factories
  ,   descriptors = {}
  ,   modules = {}
  ,   packages = {}

  ,   ERR_MISS_ID = 'Module id is not specified'
  ,   COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g
  ,   REQUIRE_MATCH = /(^|[^\w\_])require\s*\(('|")([\w\W]*?)('|")\)/g
  ,   TRANSPORT_WRAPPER = 'define("{{id}}", function(require, exports, module, undefined) { {{source}}\n/**/})\n//@ sourceURL={{url}}\n'

  /**
   * Pareses module source and returns array of required module ID's
   * @param {String} source
   *    module source
   * @returns {String[]}
   */
  function depends(source) {
      var source = source.replace(COMMENTS_MATCH, "")
      , dependencies = []
      , dependency
      while(dependency = REQUIRE_MATCH.exec(source))
        dependencies.push(dependency[3])
      return dependencies
  }
  /**
   * Resolves relative module ID to an absolute id.
   * @param {String} id
   *    relative id to be resolved
   * @param {String} baseId
   *    absolute id of a requirer module
   * @return {String}
   *    absolute id
   */
  function resolveId(id, baseId) {
    var parts, part, root, base

    if (0 < id.indexOf('://')) return id
    parts = id.split('/')
    root = parts[0]
    if (root.charAt(0) != '.') return id
    baseId = baseId || ''
    base = baseId.split('/')
    base.pop()
    while (part = parts.shift()) {
      if (part == '.') continue
      if (part == '..' && base.length) base.pop()
      else base.push(part)
    }
    return base.join('/')
  }

  function resolveURL(id) {
    var name = id.split('/')[0]
    ,   descriptor
    ,   location
    ,   directories
    ,   lib

    if (!(name in packages)) return id + '.js'
    descriptor = packages[name]
    location = descriptor.location || (descriptor.location = 'packages/')
    directories = descriptor.directories || (descriptor.directories = {})
    lib = directories.lib || (directories.lib = 'lib')
    return (
      location +
      id == name ? descriptor.main : lib + id.substr(name.length) +
      '.js'
    )
  }

  function Resolver(topFactory, callback) {
    var resolved = 0
    ,   dependencies = topFactory.dependencies
    function resolver(error, factory) {
      var index = dependencies.indexOf(factory.id)
      if (0 <= index || topFactory == factory) {
        depends(factory.create + '').forEach(function(id) {
          id = resolveId(id, factory.id)
          ;(factory.dependencies || (factory.dependencies = [])).push(id)
          dependencies.push(id)
          load(id, function(e) {
            if (e) return callback(e)
          })
        })
        if (dependencies.length == ++resolved) {
          teleport.removeListener('define', resolver)
          callback(null, topFactory)
        }
      }
    }
    teleport.on('define', resolver)
  }

  function load(id, callback) {
    var factory = factories[id] || (factories[id] =
          { ready: false
          , loading: false
          , create: null
          , id: id
          , url: resolveURL(id)
          , dependencies: []
          })
    ,   descriptor = descriptors[id]

    if (factory.ready) callback(null, factory)
    else if (!factory.loading) {
      Resolver(factory, callback)
      factory.loading = true
      fetch(factory, function (e, factory, source) {
        if (e) return callback(e)
        else {
          evaluate(source, factory.id, factory.url)
        }
      })
    }
  }

  function evaluate(source, id, url) {
    var module = document.createElement('script')
    if (source.substr(0, 7) !== 'define(') {
      source = TRANSPORT_WRAPPER
        .replace('{{id}}', id)
        .replace('{{url}}', url)
        .replace('{{source}}', source)
    }
    module.textContent = source
    module.setAttribute('id', id)
    module.setAttribute('type', 'text/javascript')
    module.setAttribute('data-loader', 'teleport')
    document.getElementsByTagName('head')[0].appendChild(module)
  }

  function fetch(factory, callback) {
    var request = new XMLHttpRequest()
    request.open("GET", factory.url, true)
    request.onreadystatechange = function onreadystatechange() {
      if (request.readyState == 4) {
        if ( (request.status == 200 || request.status == 0)
          && request.responseText != ''
        ) callback(null, factory, request.responseText)
        else callback(request)
      }
    }
    request.send(null)
  }

  function Require(baseId) {
    function require(id, callback) {
      id = resolveId(id, baseId)
      var module = modules[id] || (modules[id] = { id: id })
      ,   exports
      if (!module.exports) {
        exports = module.exports = {}
        load(id, function(e) {
          if (e && callback) return callback(e)
          factories[id].create.call(NaN, Require(id), exports, module)
          if (callback) callback(module.exports)
        })
      }
      return module.exports
    }
    require.main = Require.main
    return require
  }
  Require.main = function main(id, callback) {
    id = resolveId(id, '')
    Require.main = modules[id] = { id: id }
    return Require('')(id, callback)
  }

  exports.require = Require('')
})
