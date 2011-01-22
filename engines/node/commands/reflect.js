"use strict";

var Q = require("q")
var pu = require("promised-utils"), Promised = pu.Promised, all = pu.all
var Registry = require("teleport/registry").Registry
var moduleUtils = require("teleport/utils/module")
var projectUtils = require("teleport/project")
var fs = require("promised-fs")

exports.reflect = function reflect(path) {
  path = projectUtils.getRoot(path)
  var name = projectUtils.getName(path)
  var destinationPath = projectUtils.getDependenciesPath(path)
  var catalog = Registry().get('packages')
  
  return reflectPackage(destinationPath, name, catalog, [])
}


var reflectPackage = Promised(function reflectPackage(path, name, catalog, $$) {
  $$.push(name)
  var destinationPath = fs.join(path, name)
  var pack = catalog[name]
  var modules = pack.get('modules')
  var dependencies = pack.get('dependencies')
  console.log("Reflect package:" + name)
  var modulesReady = writeModules(destinationPath, modules, pack)
  var dependenciesReady = reflectPackages(path, dependencies, $$)
  return all(modulesReady, dependenciesReady)
})
exports.reflectPackage = reflectPackage

var reflectPackages = Promised(function reflectPackages(path, catalog, $$) {
  return all(Object.keys(catalog).filter(function(name) {
                                    return !~$$.indexOf(name)
                                  }).map(function (name) {
                                    return reflectPackage(path, name, catalog, $$)
                                  }))
})
exports.reflectPackages = reflectPackages

var writeModules = Promised(function writeModules(path, modules, catalog) {
  all(Object.keys(modules).map(function (id) {
    var destinationPath = fs.join(path, id)
    var source = catalog.getModulePath(id)
    return Q.when(source, function() {
      console.log("   " + id)
    })
    //return fs.write(path, catalog.getModuleTransport(id))
  }))
})
