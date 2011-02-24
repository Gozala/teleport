'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('./strings')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   Module = require('./module').Module
,   Package = require('./package').Package

,   EXTENSION = CONST.EXTENSION
,   SEPARATOR = CONST.SEPARATOR
,   VERSION_MARK = CONST.VERSION_MARK
,   VERSION = CONST.VERSION
,   PREFIX = CONST.PREFIX
,   LIB = CONST.LIB
,   TRANSPORT_WRAPPER = CONST.TRANSPORT_WRAPPER
,   MODULE_NOT_FOUND_ERROR = CONST.MODULE_NOT_FOUND_ERROR
,   PACKAGE_NOT_FOUND_ERROR = CONST.PACKAGE_NOT_FOUND_ERROR
,   COMMENTS_MATCH = CONST.COMMENTS_MATCH
,   REQUIRE_MATCH = CONST.REQUIRE_MATCH
,   root = CONST.NPM_DIR
,   DESCRIPTOR_PATH = fs.join(VERSION, PREFIX, CONST.DESCRIPTOR_FILE)

var PromisedJSON = Promised(JSON)

var RegistryTrait = Trait(
{ packages: Trait.required
, root: root
, toJSON: function toJSON() {
    var json, packages, descriptors
    if (!this._json) {
      json = {}
      packages = this.packages
      descriptors = Object.keys(packages).map(function (key) {
        return when
        ( packages[key].invoke('toJSON')
        , function (descriptor) { json[key] = descriptor }
        , function (reason) { json[key] = { error: String(reason) } }
        )
      })
      this._json = when(descriptors, function() {
        return this._json = json
      })
    }
    return this._json
  }
, stringify: function stringify(format) {
    return PromisedJSON.invoke('stringify', [this.toJSON(), null, format])
  }
})
exports.Registry = function Registry(path) {
  var registry = Object.create(Registry.prototype)
  registry.packages = {}
  if (path) registry.root = String(path)
  registry = RegistryTrait.create(registry)
  return Promised(when(fs.list(registry.root), function onEntries(entries) {
    var packages = registry.packages
    entries.forEach(function(name) {
      if ('.' === name.charAt(0)) return
      packages[name] = Package(
      { name: name
      , registry: registry
      })
    })
    return registry
  }))
}
