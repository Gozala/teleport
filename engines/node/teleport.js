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
