/*
 * CommonJS Modules 1.1 loader.
 */
var teleport = new function Teleport(global, undefined) {
  'use strict'

  var exports = this
  ,   factories = {}
  ,   LISTENERS = {}

  /**
   * Implementation of CommonJS
   * [Modules/Transport/D](http://wiki.commonjs.org/wiki/Modules/Transport/D)
   * @param {Object} descriptors
   *    Hash of module top level module id's and relevant factories.
   * @param {String[]} dependencies
   *    Top-level module identifiers corresponding to the shallow dependencies
   *    of the given module factory
   * @param {Object} extra
   *    **Non-standard** helper utilities (improving debugging)
   */
  function define(id, dependencies, factory) {
    if (undefined == factory) {
      factory = dependencies
      dependencies = undefined
    }
    var descriptor = factories[id] || (factories[id] = {})
    descriptor.ready = true
    descriptor.create = factory
    descriptor.dependencies = dependencies
    emit('define', null, descriptor)
  }

  function emit(topic, error, data) {
    var listeners = LISTENERS[topic]
    ,   listener
    ,   ii
    ,   i
    if (listeners) {
      listeners = listeners.slice(0)
      for (i = 0, ii = listeners.length; i < ii; i++ ) {
        try {
          listeners[i](error, data)
        } catch(e) {
          console.error(e)
        }
      }
    }
  }

  function require(id) {
    var module = { id: id, exports: {} }
    factories[id].create.call(NaN, require, module.exports, module)
    return module.exports
  }

  function Require() {
    var $ = require('teleport/engine').require
    return exports.require = exports.require == global.require ?
      global.require = $ : $
  }
  
  exports.require = function require(id) {
    return Require()(id)
  }
  exports.require.main = function(id) {
    return Require().main(id)
  }
  
  if (!global.define) global.define = define
  if (!global.require) global.require = this.require

  define('teleport/core', function(require, exports, module, undefined) {
    exports.factories = factories
    exports.on = function on(topic, listener) {
      var listeners = LISTENERS[topic] || (LISTENERS[topic] = [])
      if (0 > listeners.indexOf(listener)) listeners.push(listener)
    }
    exports.removeListener = function removeListener(topic, listener) {
      var listeners = LISTENERS[topic]
      ,   index = -1
      if (listeners) {
        index = listeners.indexOf(listener)
        if (0 >= index) listeners.splice(index, 1)
      }
    }
  })
}(this)
define('teleport/engine', function(require, exports, module, undefined) {
  'use strict'
  
  var teleport = require('teleport/core')
  
  ,   factories = teleport.factories
  ,   descriptors = {}
  ,   modules = {}
  ,   packages = {}

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
        factory.dependencies.forEach(function(id) {
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
