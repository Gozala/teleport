'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   Module = require('./catalog/module').Module
,   Package = require('teleport/package').Package

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
,   root = fs.Path(CONST.NPM_DIR)
,   DESCRIPTOR_PATH = fs.join(VERSION, PREFIX, CONST.DESCRIPTOR_FILE)

var RegistryTrait = Trait(
{ packages: Trait.required
, root: root
, toJSON: function toJSON() {
    var json = {}
    ,   packages = this.packages
    for (var name in packages) json[name] = packages[name].invoke('toJSON')
    return json
  }
})
exports.Registry = function Registry(path) {
  var registry = Object.create(Registry.prototype)
  registry.packages = {}
  if (path) registry.root = fs.path(path)
  registry = RegistryTrait.create(registry)
  return Promised(when(registry.root.list(), function onEntries(entries) {
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
