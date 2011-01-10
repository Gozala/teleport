/* vim:et:ts=2:sw=2:sts=2
 * CommonJS Modules 1.1 loader.
 */
var teleport = new function Teleport(global, undefined) {
  'use strict'

  var exports = this
    , mainId
    , descriptors = {}
    , modules = {}

    , MAIN_ATTR = 'data-main'
    , SCRIPT_ELEMENT = 'script'
    , UNDEFINED = 'undefined'
    , SCRIPT_TYPE = 'text/javascript'
    , BASE = getBase()

    , isBrowser = UNDEFINED !== typeof window && window.window === window
    , hasNewJS = isBrowser && 0 <= navigator.userAgent.indexOf('Firefox')
    , isWorker = !isBrowser && UNDEFINED !== typeof importScripts

    if (hasNewJS) SCRIPT_TYPE = 'application/javascript;version=1.8'

  function getBase() {
    var base = (document.baseURI || document.URL).split('?')[0].split('#')[0]
    if (0 < base.substr(base.lastIndexOf('/')).indexOf('.'))
      base = base.substr(0, base.lastIndexOf('/') + 1)
    return base
  }

  function declareDependency(dependent, dependency) {
    ;(dependency.dependents || (dependency.dependents = {}))[dependent.id] =
      dependent
  }

  function updateDependencyStates(descriptor, dependencies) {
    var dependency, i, ii, pending = 0
    if (dependencies) {
      for (i = 0, ii = dependencies.length; i < ii; i++) {
        // Getting module descriptor for each dependency.
        dependency = ModuleDescriptor(dependencies[i])
        if (!dependency.ready) {
          ++ pending
          // Adding `descriptor` to a list of dependent modules on `dependency`.
          declareDependency(descriptor, dependency)
          // Start loading if not in progress already.
          if (!dependency.loading) load(dependency)
        }
      }
    }
    // Return list of pending dependencies.
    return pending
  }

  function moduleStateChange(descriptor) {
   if (!descriptor.ready &&
       descriptor.defined &&
       0 === updateDependencyStates(descriptor, descriptor.dependencies)
      ) onReady(descriptor)
  }

  // Notifies all the dependents that dependency is ready.
  function updateDependents(descriptor) {
    var dependency
      , name
      , dependents = descriptor.dependents

    delete descriptor.dependents
    if (dependents) {
      // Go through each dependent and check.
      for (name in dependents) moduleStateChange(dependents[name])
    }
  }

  function onDefine(descriptor) {
    // If descriptor was not ready yet.
    descriptor.defined = true
    moduleStateChange(descriptor)
  }

  function onReady(descriptor) {
    descriptor.ready = true
    updateDependents(descriptor)
    if (descriptor.execute) Require()(descriptor.id)
  }

  function ModuleDescriptor(id) {
    var descriptor
    if (id in descriptors) descriptor = descriptors[id]
    else {
      descriptor = descriptors[id] =
      { ready: false
      , loading: false
      , defined: false
      , factory: null
      , id: id
      , url: resolveURL(id)
      , dependencies: null
      , dependents: null
      }
    }
    return descriptor
  }

  function getMainId() {
    var i, ii, main, elements = document.getElementsByTagName(SCRIPT_ELEMENT)
    for (i = 0, ii = elements.length; i < ii; i++)
      if (main = elements[i].getAttribute(MAIN_ATTR)) break
    return main
  }
  /**
   * Implementation of CommonJS
   * [Modules/Transport/D](http://wiki.commonjs.org/wiki/Modules/Transport/D)
   * @param {Object} descriptors
   *    Hash of module top level module id's and relevant factories.
   *
   * @param {String[]} dependencies
   *    Top-level module identifiers corresponding to the shallow dependencies
   *    of the given module factory
   * @param {Object} extra
   *    **Non-standard** helper utilities (improving debugging)
   */
  function define(id, dependencies, factory) {
    var descriptor
    if (undefined == factory) {
      factory = dependencies
      dependencies = undefined
    }

    descriptor = ModuleDescriptor(id)
    descriptor.factory = factory
    descriptor.dependencies = dependencies
    onDefine(descriptor)
  }
  exports.define = define

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
    var parts, part, root, base, extension
    // If given `id` is not relative or `baseId` is not provided we can't resolve.
    if (!baseId || !isModuleIdRelative(id)) return id
    extension = getExtension(baseId)
    parts = id.split('/')
    root = parts[0]
    base = baseId.split('/')
    if (base.length > 1) base.pop()
    while (part = parts.shift()) {
      if (part == '.') continue
      if (part == '..' && base.length) base.pop()
      else base.push(part)
    }
    return base.join('/') + extension
  }

  function isModuleIdRelative(id) {
    return '.' === id.charAt(0)
  }

  function getExtension(id) {
    var basename = id.split('/').pop()
      , index = basename.lastIndexOf('.')
    return 0 < index ? basename.substr(index) : ''
  }

  function resolveURL(id) {
    id = resolveId(id, BASE)
    id = 0 < id.indexOf('://') ? id : 'packages/' + id + '.js'
    return id + '?module&transport'
  }

  // Loads module and all it's dependencies. Once module with all the
  // dependencies is loaded callback is called.
  function load(descriptor) {
    if (!descriptor.loading) {
      descriptor.loading = true
      fetch(descriptor)
    }
  }

  function fetch(descriptor) {
    var module = document.createElement(SCRIPT_ELEMENT)
    module.setAttribute('type', SCRIPT_TYPE)
    module.setAttribute('data-loader', 'teleport')
    module.setAttribute('data-id', descriptor.id)
    module.setAttribute('src', descriptor.url)
    document.getElementsByTagName('head')[0].appendChild(module)
  }

  function Module(id) {
    return modules[id] || (modules[id] = { id: id, exports: {} })
  }

  // `require` generator fun modules.
  function Require(requirerID) {
    function require(id) {
      var module, descriptor
      // resolving relative id to an absolute id.
      id = resolveId(id, requirerID)
      // using module if it was already created, otherwise creating one
      // and registering into global module registry.
      var module = Module(id)
      if (!module.filename) {
        descriptor = ModuleDescriptor(id)
        module.filename = descriptor.url
        descriptor.factory.call(NaN, Require(id), module.exports, module)
      }
      return module.exports
    }
    require.main = Require.main
    return require
  }

  function main(id) {
    // setting main in order to reuse it later
    Require.main = Module(id)
    return require(id)
  }
  exports.main = main

  function require(id) {
    var module = Module(id)
      , descriptor = ModuleDescriptor(id)

    descriptor.execute = true
    load(descriptor)
    return module.exports
  }
  require.main = main
  exports.require = require

  if (!('require' in global)) global.require = require
  if (!('define' in global)) global.define = define

  if (mainId = getMainId()) require.main(mainId)
}(this)
