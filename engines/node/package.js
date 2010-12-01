'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   PackageModules = require('./catalog/module').PackageModules

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
,   DESCRIPTOR_PATH = fs.join(VERSION, PREFIX)
,   DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE
,   JSON_PARSE_ERROR = 'Failed to parse package descriptor: '

// Function takes path to the package descriptor parses it. It also applies overlay
// metadata. This is a promised function so it can take promises and will
// return promise of parsed json back.
function Descriptor(options) {
  return when(fs.path([options.path, DESCRIPTOR_FILE]).read(), function fileRead(content) {
      var descriptor = {}
      try {
        descriptor = Object.create(JSON.parse(content))
      } catch (error) {
        var errors = options.errors || (options.errors = [])
        errors.push(
        { type: JSON_PARSE_ERROR
        , error: error
        })
      }
      // If 'teleport' overlay is found return immediately.
      if ('overlay' in descriptor && 'teleport' in descriptor.overlay) {
        var teleport = descriptor.overlay.teleport
        for (var key in teleport) descriptor[key] = teleport[key]
      }
      return Object.create(options, { descriptor: { value: descriptor } })
  })
}

var PackageTrait = Trait
( PackageModules
, Trait(
  { path: Trait.required
  , registry: Trait.required
  , descriptor: Trait.required
  , get name() { return this.descriptor.name }
  , get dependencies() {
      var dependencies = this.descriptor.dependencies
        , packages = this.registry.packages
        , result = {}
      for (var name in dependencies) result[name] = packages.name
      return result
    }
  , get version() { return this.descriptor.version }
  , get main() { return this.descriptor.main }
  , get modules() { return this.descriptor.modules }
  , get directories() { return this.descriptor.directories }
  , toJSON: function toJSON() { return Object.getPrototypeOf(this.descriptor) }
  , getContent: function getContent(relativePath) {
      path = fs.path([this.path, relativePath])
      return path.read()
    }
  })
)

/**
 * Package class can be used to create instances that expose promise based API
 * to read metadata or a modules from the CommonJS packages. Constructor takes
 * one argument representing package name that is installed or linked by npm.
 */
function Package(options) {
  // If options don't contains path, but contain a name property use it to
  // generate path to a package descriptor directory in npm registry.
  if (!('path' in options) && 'name' in options) 
    options.path = String(root.join(options.name, DESCRIPTOR_PATH))
  // If path to a package descriptor is known reading, parsing and flattening
  // it.
  if ('path' in options) options = Descriptor(options)
  // If neither path, name or descriptor was passed throwing an exception since
  // we can't really build packages wrapper from it.
  else if (!('descriptor' in options)) throw new Error('Wrong options were passed')
  return Promised(when(options, function onOptions(options) {
    return PackageTrait.create(options)
  }))
}
exports.Package = Package
