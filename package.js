'use strict'

var fs =  require('promised-fs')
  , packageUtils = require('./common/utils/package')
  , Trait = require('light-traits').Trait
  , CONST = require('./strings')
  , Q = require('q'), when = Q.when, reject = Q.reject
  , pu = require('promised-utils'), Promised = pu.Promised, all = pu.all
  , PackageModules = require('./module').PackageModules

  , DESCRIPTOR_PATH = fs.join(CONST.VERSION, CONST.PREFIX)
  , DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE
  , JSON_PARSE_ERROR = 'Failed to parse package descriptor: '
  , ERR_NOT_IN_PACKAGE = CONST.ERR_NOT_IN_PACKAGE


function flattenObject(object) {
  var value = {}, key
  for (key in object) value[key] = object[key]
  return value
}

function filterJSPaths(paths) {
  return when(paths, function(paths) {
    return paths.filter(function (path) { return '.js' == fs.extension(path) })
  })
}

function mapJSPathsToIds(paths, root) {
  return when(paths, function(paths) {
    var map = {}
    paths.forEach(function (path) {
      var subpath = fs.join(".", path)
      map[subpath.substr(0, subpath.length - 3)] = fs.join(root, path)
    })
    return map
  })
}

// Function takes path to the package descriptor parses it. It also applies overlay
// metadata. This is a promised function so it can take promises and will
// return promise of parsed JSON back.
function Descriptor(options) {
  return when(fs.path([options.path, DESCRIPTOR_FILE]).read(), function fileRead(content) {
      var descriptor
      try {
        descriptor = JSON.parse(content)
      } catch (error) {
        var errors = options.errors || (options.errors = [])
        errors.push(
        { type: JSON_PARSE_ERROR
        , error: error
        })
        descriptor = { name: options.name, error: String(error) }
      }
      
      return Object.create(options, {
        descriptor: {
          value: packageUtils.normalizeOverlay(descriptor, 'teleport')
        }
      })
  })
}

var PackageTrait = Trait
( PackageModules
, Trait(
  { path: Trait.required
  , valueOf: function valueOf() {
      return when(this.modules, function() { return this }.bind(this))
    }
  , registry: Trait.required
  , descriptor: Trait.required
  , get libPath() {
      return fs.join(this.path, this.descriptor.overlay.teleport.directories.lib)
    }
  , get name() { return this.descriptor.overlay.teleport.name }
  , get files() {
      var descriptor, listReady, ignore, paths, pathsPromise
      if (!this._files) {
        descriptor = this.descriptor.overlay.teleport
        ignore = descriptor.ignore
        paths = []
        pathsPromise = all(descriptor.files.map(function(path) {
          path = fs.join(this.path, path)
          return when(fs.listTree(fs.join(path)), function (entries) {
            paths.push.apply(paths, entries)
            return paths
          }, function() {
            paths.push(path)
          })
        }, this))
        return when(pathsPromise, function() {
          return paths.filter(function(path) {
            return !ignore.some(function(pattern) {
              return 0 == fs.normal(path).indexOf(pattern)
            })
          })
        })
      }
      return this._files
    }
  , get isAMDFormat() {
      return 'amd' === this.descriptor.overlay.teleport.format.toLowerCase()
    }
  , get dependencies() {
      var value
        , dependencies
        , nestedDependencies
        , name
        , key
        , packages

      if (this._dependencies) return this._dependencies
      value = Object.create(nestedDependencies = {})
      packages = this.registry.packages
      dependencies = Object.keys(this.descriptor.overlay.teleport.dependencies)
      dependencies = dependencies.map(function(name) {
        value[name] = packages[name]
        return when(packages[name].get('dependencies'), function(dependencies) {
          for (key in dependencies)
            if (!(key in value)) nestedDependencies[key] = packages[key]
        }, function() {})
      })
      return Promised(when(all(dependencies), function() {
        // Adding teleport as non-explicit dependency in order to avoid
        // inherited dependencies when reflecting package in AMD.
        nestedDependencies.teleport = packages.teleport
        return this._dependencies = value
      }))
    }
  , get version() { return this.descriptor.overlay.teleport.version }
  , get main() { return this.descriptor.overlay.teleport.main }
  , get directories() { return this.descriptor.overlay.teleport.directories }
  , toJSON: function toJSON() {
      return flattenObject(this.descriptor)
    }
  , getContent: function getContent(relativePath) {
      var path = fs.path([this.path, relativePath])
      return path.read()
    }
  , get modules() {
      var overlay
      if (!this._modules) {
        overlay = this.descriptor.overlay.teleport
        this._modules = when
        ( mapJSPathsToIds(filterJSPaths(fs.listTree(this.libPath)), overlay.directories.lib)
        , function (modules) {
            return packageUtils.addModuleAliases(overlay, modules).modules
          }
        , function () {
            return overlay.modules
          }
        )
      }
      return this._modules
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
    options.path = fs.join(options.registry.root.valueOf(), options.name, DESCRIPTOR_PATH)
  // If path to a package descriptor is known reading, parsing and flattening
  // it.
  if ('path' in options) options = Descriptor(options)
  // If neither path, name or descriptor was passed throwing an exception since
  // we can't really build packages wrapper from it.
  else if (!('descriptor' in options)) throw new Error('Wrong options were passed')
  return Promised(when(options, function onOptions(options) {
    return PackageTrait.create(options).valueOf()
  }))
}
exports.Package = Package
