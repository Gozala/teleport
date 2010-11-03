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
    if (base.length > 1) base.pop()
    while (part = parts.shift()) {
      if (part == '.') continue
      if (part == '..' && base.length) base.pop()
      else base.push(part)
    }
    return base.join('/')
  }

  function resolveURL(id) {
    return 'packages/' + id + '.js'
  }

  // Tracks module loading. Once it's loaded all the dependencies are analyzed
  // and loaded unless they are already loaded or fetched. Once module with
  // all it's dependencies is loaded callback will be called.
  function Resolver(trackedFactory, callback) {
    var resolved = 0
    ,   trackedDependencies = trackedFactory.dependencies
    // Registering listener that is called whenever module is defined.
    teleport.on('define', function resolver(error, factory) {
      var index = trackedDependencies.indexOf(factory.id)
      // If defined module is a dependency of tracked module
      // or a tracked module itself:
      if (0 <= index || trackedFactory == factory) {
        // - Finding modules dependencies.
        depends(factory.create + '').forEach(function(id) {
          id = resolveId(id, factory.id)
          // - Registering each dependency in the module factory.
          var dependencies = factory.dependencies || (factory.dependencies = [])
          if (0 > dependencies.indexOf(id)) dependencies.push(id)
          // - Registering each dependency to the tracked module factory.
          if (0 > trackedDependencies.indexOf(id)) trackedDependencies.push(id)
          // - Loading a dependency. If module loading fails
          //   calling tracked module's callback with an error.
          load(id, function(error) { if (error) return callback(error) })
        })
        // If all the dependencies for the tracked module are loaded calling
        // removing a listener and callback a callback with a module factory.
        if (trackedDependencies.length < ++resolved) {
          teleport.removeListener('define', resolver)
          callback(null, trackedFactory)
        }
      }
    })
  }

  // loads module and all it's dependencies. Once module with all the
  // dependencies is loaded callback is called.
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

    if (factory.ready) return callback(null, factory)
    else if (!factory.loading) {
      factory.loading = true
      fetch(factory)
    }
    Resolver(factory, callback)
  }

  function fetch(factory) {
    var module = document.createElement('script')
    module.setAttribute('id', factory.id)
    module.setAttribute('type', 'text/javascript')
    module.setAttribute('data-loader', 'teleport')
    module.setAttribute('src', factory.url)
    document.getElementsByTagName('head')[0].appendChild(module)
  }

  // `require` generator fun modules.
  function Require(baseId) {
    baseId = baseId || ''
    function require(id) {
      // resolving relative id to an absolute id.
      id = resolveId(id, baseId)
      // using module if it was already created, otherwise creating one
      // and registering into global module registry.
      var module = modules[id] || (modules[id] = { id: id, exports: {} })
      ,   exports
      // if module has no exports than it has not been loaded yet. In that
      // case we need to load it.
      if (!module.loaded) {
        factories[id].create.call(NaN, Require(id), module.exports, module)
        module.loaded = true
      }
      return module.exports
    }
    require.main = Require.main
    return require
  }
  Require.main = function main(id) {
    // setting main in order to reuse it later
    Require.main = modules[id] = { id: id, exports: {} }
    return Require()(id)
  }

  exports.require = function require(id, callback) {
    callback = callback || function(error) { console.error(error) }
    var module = modules[id] || (modules[id] = { id: id, exports: {} })
    setTimeout(load, 0, id, function(e) {
      if (e) return callback(e)
      try {
        Require()(id)
      } catch(e) {
        callback(e)
      }
    })
    return module.exports
  }
  exports.require.main = function(id, callback) {
    Require.main = modules[id] = { id: id, exports: {} }
    return exports.require(id)
  }
})
