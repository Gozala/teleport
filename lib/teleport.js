/*
 * CommonJS Modules 1.1 loader.
 */
var teleport = new function Teleport(global, undefined) {
  'use strict'

  var factories = {}
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
  }

  function on(topic, listener) {
    var listeners = LISTENERS[topic] || (LISTENERS[topic] = [])
    if (0 > listeners.indexOf(listener)) listeners.push(listener)
  }
  function off(topic, listener) {
    var listeners = LISTENERS[topic]
    ,   index = -1
    if (listeners) {
      index = listeners.indexOf(listener)
      if (0 >= index) listeners.splice(index, 1)
    }
  }

  function emit(topic, error, data) {
    var listeners = LISTENERS[topic]
    ,   listener
    ,   ii
    ,   i
    if (listeners) {
      for (i = 0, ii = listeners.length; i < ii; i++ ) {
        try {
          listeners[i](error, data)
        } catch(e) {
          console.error(e)
        }
      }
    }
  }

  function require(id, callback) {
    var module = { id: 'teleport/engine', exports: { factories: factories } }
    factories['teleport/engine'].create.call(NaN, null, module.exports, module)
    teleport.require = module.exports.require
    if (global.require == require) global.require = teleport.require
    return teleport.require(id, callback)
  }

  this.require = require
  this.define = define
  this.on = on
  this.removeListener = off
  if (!global.define) global.define = define
  if (!global.require) global.require = require

  define('teleport/core', function(require, exports, module, undefined) {
    module.exports = teleport
  })
}(this)
