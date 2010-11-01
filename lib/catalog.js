'use strict'

var fs = require('promised-fs')
,   npm = require('npm')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   Module = require('./catalog/module').Module
,   packagePath = require('./catalog/package').packagePath
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')

,   VERSION = CONST.VERSION
,   PREFIX = CONST.PREFIX
,   DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE
,   ERR_PACKAGE_NOT_FOUND = CONST.ERR_PACKAGE_NOT_FOUND

,   root = fs.Path(CONST.NPM_DIR)
,   descriptorPath = fs.join(VERSION, PREFIX, DESCRIPTOR_FILE)

// Function takes package descriptor and parses it. It also applies overlay
// metadata. This is a promised function so it can take promises and will
// return promise of parsed json back.
var parse = Promised(function parse(descriptor) {
  var meta = JSON.parse(descriptor)
  // If 'teleport' overlay is found return immediately.
  if (!('overlay' in meta) || !('teleport' in meta.overlay)) return meta
  var teleport = meta.overlay.teleport
  for (var key in teleport) meta[key] = teleport[key]
  return meta
})

// Function reads package descriptor and returns promise for the metadata.
function Descriptor(name) {
  return parse(root.join(name, descriptorPath).read())
}

// Returns package descriptors for all the dependencies
var dependencies = Promised(function dependencies(meta, packages, callback) {
  packages[meta.name] = meta
  // If there is no dependencies return immediately.
  if (!('dependencies' in meta)) return callback(null, packages)
  // Filtering out only dependencies that are not collected yet and
  // registering them.
  var metaDepends = Object.keys(meta.dependencies).filter(function(name) { 
   if (!(name in packages)) return packages[name] = true
  })
  // If package does not has any new dependencies return immediately.
  if (!metaDepends.length) return callback(null, packages)
  // Collecting metadata for all the newly discovered dependencies.
  var scanned = 0
  metaDepends.map(Descriptor).forEach(function(dependency, i) {
    when
    ( dependency
    , function resolved(dependency) {
        // Scanning dependencies.
        dependencies(dependency, packages, function tracker() {
          // If all the dependent packages are scanned for dependencies
          // calling a callback.
          if (metaDepends.length == ++scanned) callback(null, packages)
        })
      }
    , function rejected(reason) {
        // Calling callback with an error message if package descriptor not
        // found.
        callback(ERR_PACKAGE_NOT_FOUND
          .replace(/{{main}}/g, meta.name)
          .replace(/{{name}}/g, metaDepends[i])
        )
      }
    )
  })
})

// Returns metadata for the package and all it's dependencies.
// Takes promised string of the package descriptor as an argument. If argument
// is not passed finds package descriptor under the current working directory
// and returns metadata for it.
exports.Catalog = function Catalog(path) {
  var root = null
  // Parsing `package.json` for the package under the root
  var main = when(packagePath(path), function despriptorResolved(path) {
    return parse((root = path).join(DESCRIPTOR_FILE).read())
  })
  // Building a catalog from all the (_nested_) dependencies
  return when(dependencies(main, {}), function catalogResolved(packages) {
    return CatalogTrait.create({ packages: packages, root: root })
  })
}

var CatalogTrait = Trait(
{ packages: Trait.required
, root: Trait.required
, module: function module(url) {
    return Module({ url: url, packages: this.packages, packagesPath: root })
  }
})


