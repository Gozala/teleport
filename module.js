'use strict'

var fs =  require('promised-fs')
  , when = require('q').when
  , Trait = require('light-traits').Trait
  , M = require('./common/utils/module'), wrapInTransport = M.wrapInTransport
                                 , getPackageName = M.getPackageName
                                 , getPackageRelativeId = M.getPackageRelativeId
                                 , isMainModule = M.isMainModule
                                 , isModuleIdRelative = M.isModuleIdRelative
  , CONST = require('./strings')

  , MODULE_NOT_FOUND_ERROR = CONST.MODULE_NOT_FOUND_ERROR
  , PACKAGE_NOT_FOUND_ERROR = CONST.PACKAGE_NOT_FOUND_ERROR


exports.PackageModules = Trait(
{ path: Trait.required
, dependencies: Trait.required
, name: Trait.required
, descriptor: Trait.required
, isAMDFormat: Trait.required
, getModuleTransport: function getModuleTransport(id) {
    var errorSource = MODULE_NOT_FOUND_ERROR
                      .replace('{{id}}', id)
                      .replace('{{path}}', fs.join(this.path, this.getModulePath(id)))

    return when
    ( this.getModuleSource(id)
    , this.isAMDFormat ? null : wrapInTransport.bind(null, id)
    , wrapInTransport.bind(null, id, errorSource)
    )
  }
, getModulePath: function getModuleSource(id) {
    var packageName = getPackageName(id)
      , relativeId
      , path
      , descriptor
      , modules

    // If this module is not from this package we can't get path to it
    // so setting it to `null`.
    if (packageName !== this.name)
      path = null
    else {
      // If module id is for a main module (does not contains separators)
      // checking taking path to the main module from the package descriptor.
      descriptor = this.descriptor.overlay.teleport
      if (isMainModule(id)) path = descriptor.main
      // If module is not a main then checking if path for this module
      // is defined in package descriptor, if it's not there then we generate
      // path by adding relative module ID to path of a package `lib`. In
      // addition we add `.js` extension if id does not already has one.
      else {
        modules = descriptor.modules
        relativeId = getPackageRelativeId(id)
        if (modules && (path = modules[relativeId])) path
        else path = fs.join(descriptor.directories.lib, relativeId)
      }
      if ('.js' !== path.substr(-3)) path += '.js'
    }
    return path
  }
, getModuleSource: function getModuleSource(id) {
    var packageName = getPackageName(id)
      , source

    if (isModuleIdRelative(id))
      source = this.getContent(id)
    else if (packageName === this.name)
      source = this.getContent(this.getModulePath(id))
    else
      source = when(this.dependencies, function(dependencies) {
        var dependency = dependencies[packageName]
        if (dependency) source = dependency.invoke('getModuleSource', [id])
        else source = PACKAGE_NOT_FOUND_ERROR.replace('{{name}}', packageName)
        return source
      })
    return source
  }
})
