define('teleport/engine', function(require, exports, module, undefined) {
  'use strict'
  var factories = exports.factories
  ,   modules = {}
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
  /**
   * CommonJS `require` function generator.
   */
  function Require(baseId) {
    var require = function require(id) {
      id = resolveId(id, baseId)
      var module = modules[id] || (modules[id] = { id: id })
      if (!module.exports) {
        factories[id].create.call(NaN, Require(id), module.exports = {}, module)
      }
      return module.exports
    }
    require.main = Require.main
    return require
  }
  Require.main = function main(id) {
    id = resolveId(id, '')
    Require.main = modules[id] = { id: id }
    return Require('')(id)
  }

  exports.require = Require('')
})
