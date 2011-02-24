"use strict";

var Q = require("q")
var pu = require("promised-utils"), Promised = pu.Promised, all = pu.all
var Registry = require("teleport/registry").Registry
var moduleUtils = require("teleport/common/utils/module")
var projectUtils = require("teleport/project")
var fs = require("promised-fs")

exports.reflect = function reflect(path) {
  path = projectUtils.getRoot(path)
  var name = projectUtils.getName(path)
  var destinationPath = projectUtils.getDependenciesPath(path)
  var catalog = Registry().get('packages')
  var packages = []

  return Q.when(reflectPackage(destinationPath, name, catalog, packages), function() {
    console.log('Reflected packages:\n ', packages.join('\n  '))
  }, function (reason) {
    console.error("Failed to reflect cause:", reason)
  })
}


var reflectPackage = Promised(function reflectPackage(path, name, catalog, $$) {
  $$.push(name)
  var destinationPath = fs.join(path, name)
  var pack = catalog[name]
  var modules = pack.get('modules')
  var dependencies = pack.get('dependencies')
  var files = pack.get('files')
  var modulesReady = writeModules(path, modules, pack)
  var dependenciesReady = reflectPackages(path, dependencies, $$)
  return all([modulesReady, dependenciesReady])
})
exports.reflectPackage = reflectPackage

var reflectPackages = Promised(function reflectPackages(path, catalog, $$) {
  return all(Object.keys(catalog).
            filter(function(name) { return !~$$.indexOf(name) }).
            map(function (name) {
              return reflectPackage(path, name, catalog, $$)
            }))
})
exports.reflectPackages = reflectPackages

var writeModules = Promised(function writeModules(path, modules, catalog) {
  return all(Object.keys(modules).map(function (id) {
    id = id ? fs.join(catalog.name, id) : catalog.name
    var destinationPath = moduleUtils.ensureExtension(fs.join(path, id))
    var destinationDirectory = fs.directory(destinationPath)
    var source = catalog.getModuleTransport(id)
    console.log('Writing module: ', id, '\n  ', destinationPath)
    return Q.when(fs.makeTree(destinationDirectory), function() {
      return fs.write(destinationPath, source)
    })
  }))
})

var writeFiles = Promised(function writeFiles(destinationPath, files) {
  return all(files.forEach(files).map(function (path) {
    path = fs.join(destinationPath, path)
    var destinationDirectory = fs.directory(path)
    var content = fs.read(path)
    return Q.when(fs.makeTree(destinationDirectory), function() {
      return fs.write(path, content)
    })
  }))
})
