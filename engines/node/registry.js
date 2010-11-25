'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   Module = require('./catalog/module').Module
,   PromisedTrait = require('promised-traits').PromisedTrait
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

var RegistryTrait = PromisedTrait(
{ packages: PromisedTrait.required
, getPackage: function getPackage(name) {
    return this.packages[name]
  }
})
exports.Registry = function Registry() {
  return RegistryTrait.create(when(root.list(), function(list) {
    var packages = {}
    list.forEach(function(name) {
      if ('.' !== name.charAt(0)) packages[name] = Package({ name: name })
    })
    return { packages: packages }
  }))
}
