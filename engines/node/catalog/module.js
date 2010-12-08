'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   Trait = require('light-traits').Trait
,   CONST = require('teleport/strings')

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


function getPackageName(id) {
  return id.split(SEPARATOR)[0].split(VERSION_MARK)[0]
}
exports.getPackageName = getPackageName

function getPackageVersion(id) {
  return id.split(SEPARATOR)[0].split(VERSION_MARK)[1] || ''
}
exports.getPackageVersion = getPackageVersion

function getPackageRelativeId(id) {
  return id.substr(id.indexOf(SEPARATOR) + 1)
}
exports.getPackageRelativeId = getPackageRelativeId

function isMainModule(id) {
  return 0 > id.indexOf(SEPARATOR)
}
exports.isMainModule = isMainModule

function isModuleIdRelative(id) {
  return '.' === id.charAt(0)
}
exports.isModuleIdRelative = isModuleIdRelative

function getExtension(id) {
  var basename = id.split('/').pop()
    , index = basename.lastIndexOf('.')
  return 0 < index ? basename.substr(index) : ''
}
exports.getExtension = getExtension

function resolveId(id, baseId) {
  var parts, part, root, base, extension
  // If given `id` is not relative or `baseId` is not provided we can't resolve.
  if (!baseId || !isModuleIdRelative(id)) return id
  extension = getExtension(baseId)
  parts = id.split('/')
  root = parts[0]
  base = baseId.split('/')
  if (base.length > 1) base.pop()
  while (part = parts.shift()) {
    if (part == '.') continue
    if (part == '..' && base.length) base.pop()
    else base.push(part)
  }
  return base.join('/') + extension
}
exports.resolveId = resolveId

function getDependencies(id, source) {
  var dependencies = []
    , dependency
  // strip out comments to ignore commented `require` calls.
  source = source.replace(COMMENTS_MATCH, '')
  while (dependency = REQUIRE_MATCH.exec(source)) {
    dependency = dependency[3]
    dependencies.push(resolveId(dependency, id))
  }
  return dependencies
}
exports.getDependencies = getDependencies

function wrapInTransport(id, source) {
  source = String(source)
  var dependencies = getDependencies(id, source)
    , dependsString = ''

  if (dependencies.length) dependsString = '"' + dependencies.join('","') + '"'
  return TRANSPORT_WRAPPER.
    replace('{{id}}', id).
    replace('{{dependencies}}', dependsString).
    replace('{{source}}', source)
}
exports.wrapInTransport = wrapInTransport

exports.PackageModules = Trait(
{ path: Trait.required
, dependencies: Trait.required
, name: Trait.required
, descriptor: Trait.required
, getModuleTransport: function getModuleTransport(id) {
    var errorSource = MODULE_NOT_FOUND_ERROR
                      .replace('{{id}}', id)
                      .replace('{{path}}', fs.join(this.path, this.getModulePath(id)))

    return when
    ( this.getModuleSource(id)
    , wrapInTransport.bind(null, id)
    , wrapInTransport.bind(null, id, errorSource)
    )
  }
, getModulePath: function getModuleSource(id) {
    var packageName = getPackageName(id)
      , relativeId
      , path
      , descriptor
      , modules

    if (packageName !== this.name)
      path = null
    else {
      descriptor = this.descriptor
      if (isMainModule(id)) path = descriptor.main
      else {
        modules = descriptor.modules
        relativeId = getPackageRelativeId(id)
        if (modules && (path = modules[relativeId])) path
        else path = fs.join((descriptor.directories || {}).lib || LIB, relativeId)
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
