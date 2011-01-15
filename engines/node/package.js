'use strict'

var fs =  require('promised-fs')
  , when = require('q').when
  , Trait = require('light-traits').Trait
  , CONST = require('teleport/strings')
  , Q = require('q'), when = Q.when, reject = Q.reject
  , pu = require('promised-utils'), Promised = pu.Promised, all = pu.all
  , PackageModules = require('./module').PackageModules
  , _ = require('underscore')._

  , EXTENSION = CONST.EXTENSION
  , SEPARATOR = CONST.SEPARATOR
  , VERSION_MARK = CONST.VERSION_MARK
  , VERSION = CONST.VERSION
  , PREFIX = CONST.PREFIX
  , LIB = CONST.LIB
  , TRANSPORT_WRAPPER = CONST.TRANSPORT_WRAPPER
  , MODULE_NOT_FOUND_ERROR = CONST.MODULE_NOT_FOUND_ERROR
  , PACKAGE_NOT_FOUND_ERROR = CONST.PACKAGE_NOT_FOUND_ERROR
  , COMMENTS_MATCH = CONST.COMMENTS_MATCH
  , REQUIRE_MATCH = CONST.REQUIRE_MATCH
  , root = CONST.NPM_DIR
  , DESCRIPTOR_PATH = fs.join(VERSION, PREFIX)
  , DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE
  , JSON_PARSE_ERROR = 'Failed to parse package descriptor: '
  , ERR_NOT_IN_PACKAGE = CONST.ERR_NOT_IN_PACKAGE
  , DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE


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

function mapJSPathsToIds(paths, packageName, root) {
  return when(paths, function(paths) {
    var map = {}
    paths.forEach(function (path) {
      var subpath = fs.join(packageName, path)
      map[subpath.substr(subpath, subpath.length - 3)] = fs.join(root, path)
    })
    return map
  })
}

var descriptorProperties =
[ 'name'
, 'version'
, 'description'
, 'keywords'
, 'main'
, 'maintainers'
, 'contributors'
, 'licenses'
, 'bugs'
, 'repositories'
, 'homepage'
, 'implements'
, 'scripts'
, 'error'
]

function normilizeDescriptorProperties(descriptor) {
  var teleport = descriptor.overlay.teleport
  descriptorProperties.forEach(function(key) {
    if (key in descriptor) teleport[key] = descriptor[key]
  })
}

function normilizeDescriptor(descriptor) {
  var overlay = descriptor.overlay || (descriptor.overlay = { teleport: {} })
  var teleport = overlay.teleport
  if (!teleport) teleport = overlay.teleport = {}
  normilizeDescriptorProperties(descriptor)
  normilizeDescriptorDirectories(descriptor)
  normilizeDescriptorDependencies(descriptor)
  normilizeDescriptorModules(descriptor)
  return descriptor
}

function normilizeDescriptorDirectories(descriptor) {
  // Getting overlay metadata
  var teleport = descriptor.overlay.teleport
  // If `directories` property does not exists in the `teleport` overlay
  // copying it from descriptor root, if it's not there either creating a
  // default.
  if (!teleport.directories)
    teleport.directories = descriptor.directories || { lib: './lib' }
  // If `directories` property is not an object then making `lib` property of
  // directories a stringified version of it.
  if ('object' !== typeof teleport.directories)
    teleport.directories = { lib: String(teleport.directories) }
  return descriptor
}

function normilizeDescriptorDependencies(descriptor) {
  var teleport = descriptor.overlay.teleport
  if (!teleport.dependencies) {
    if (descriptor.dependencies)
      teleport.dependencies = _.clone(descriptor.dependencies)
    else teleport.dependencies = {}
  }
  return descriptor
}

function normilizeDescriptorModules(descriptor) {
  var teleport = descriptor.overlay.teleport
  var modules = teleport.modules
  var main
  if (!modules) {
    if (descriptor.modules)
      modules = teleport.modules = _.clone(descriptor.modules)
    else modules = teleport.modules = {}
  }
  if (!(descriptor.name in modules)) {
    main = teleport.main || descriptor.main
    if (main) modules[descriptor.name] = main
  }
}

function addModulesToDescriptor(descriptor, extension) {
  var modules = descriptor.overlay.teleport.modules
  Object.keys(extension).forEach(function(key) {
    if (!(key in modules)) modules[key] = extension[key]
  })
}

// Function takes path to the package descriptor parses it. It also applies overlay
// metadata. This is a promised function so it can take promises and will
// return promise of parsed JSON back.
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
        descriptor = Object.create({ name: options.name, error: String(error) })
      }
      return Object.create(options, {
        descriptor: { value: normilizeDescriptor(descriptor) }
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
        value.teleport = packages.teleport
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
      path = fs.path([this.path, relativePath])
      return path.read()
    }
  , get modules() {
      if (!this._modules) {
        this._modules = when
        ( mapJSPathsToIds(filterJSPaths(fs.listTree(this.libPath)), this.name, this.descriptor.overlay.teleport.directories.lib)
        , function (modules) {
            addModulesToDescriptor(this.descriptor, modules)
            return this.descriptor.overlay.teleport.modules
          }.bind(this)
        , function () {
            return this.descriptor.overlay.teleport.modules
          }.bind(this)
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

exports.packagePath = function packagePath(path) {
  path = path ? fs.Path(String(path)) : fs.workingDirectoryPath()
  return when(path.list(), function(entries) {
    if (0 <= entries.indexOf(DESCRIPTOR_FILE)) return path
    var directory = path.directory()
    if (String(path) == String(directory)) return reject(ERR_NOT_IN_PACKAGE)
    return packagePath(directory)
  })
}

exports.descriptor = function descriptor() {
  return when(exports.packagePath(), function(path) {
    return path.join(DESCRIPTOR_FILE).read()
  })
}
