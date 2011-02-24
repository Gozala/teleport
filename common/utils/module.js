'use strict'

var SEPARATOR = '/'
  , VERSION_MARK = '@'
  , COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g
  , REQUIRE_MATCH = /(^|[^\w\_])require\s*\(('|")([\w\W]*?)('|")\)/g
  , TRANSPORT_WRAPPER = 'define("{{id}}", [{{dependencies}}], function(require, exports, module, undefined) { {{source}} \n/**/});'
  , MODULE_EXTENSION = '.js'

/**
 * Returns name of the package from a given top id.
 * @param {String} id
 *    absolute id.
 * @returns {String}
 */
function getPackageName(id) {
  return id.split(SEPARATOR)[0].split(VERSION_MARK)[0]
}
exports.getPackageName = getPackageName

/**
 * Returns version of the package for the given top id. If module id
 * does not contains package version info `''` is returned.
 * @param {String} id
 *    absolute id.
 * @returns {String}
 */
function getPackageVersion(id) {
  return id.split(SEPARATOR)[0].split(VERSION_MARK)[1] || ''
}
exports.getPackageVersion = getPackageVersion

/**
 * Returns string representing a path to a module with in the package's
 * `lib` directory. Path may or may not contain file extension.
 * @param {String} id
 *    absolute id.
 * @returns {String}
 */
function getPackageRelativeId(id) {
  // Returning sub-string from the begening till a firs separator.
  return id.substr(id.indexOf(SEPARATOR) + 1)
}
exports.getPackageRelativeId = getPackageRelativeId

/**
 * Checks whether or not given module id is an id for a main module (main
 * modules match package names).
 * @param {String} id
 * @returns {Boolean}
 */
function isMainModule(id) {
  // If module does not contains separator we say it's main.
  return !~id.indexOf(SEPARATOR)
}
exports.isMainModule = isMainModule

/**
 * Checks whether or not given module id is relative.
 * @param {String} id
 * @returns {Boolean}
 */
function isModuleIdRelative(id) {

  // If module id does not starts with '.' then it's absolute.
  return '.' === id.charAt(0)
}
exports.isModuleIdRelative = isModuleIdRelative

/**
 * Function returns file extension if module id contains it, otherwise `''` is
 * returned.
 * @param {String} id
 * @returns {String}
 */
function getExtension(id) {
  // Taking part of the id that follows the last separator.
  var basename = id.split('/').pop()
    , index = basename.lastIndexOf('.')
  return 0 < index ? basename.substr(index) : ''
}
exports.getExtension = getExtension

function ensureExtension(path) {
  return getExtension(path) ? path : path.concat(MODULE_EXTENSION)
}
exports.ensureExtension = ensureExtension
/**
 * Function takes absolute module id (`baseId`) and it's relative `id` and
 * returns resolved absoulte `id`.
 * @param {String} id
 *    Relative module id.
 * @param {String} baseId
 *    Module id that first argument was relative to.
 * @returns {String}
 */
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

/**
 * Function takes `id` and `source` of module and returns array of absolute
 * id's of modules that are required by a given module. (function does naive
 * parsing of source to find all the `require` statements and resolves all the
 * relative id's in it to a given `id`).
 * @param {String} id
 *    Absolute id of a module.
 * @param {String()} source
 *    Source of a module.
 * @returns {String[]}
 */
function getDependencies(id, source) {
  var dependencies = []
    , dependency
  // strip out comments to ignore commented `require` calls.
  source = String(source).replace(COMMENTS_MATCH, '')
  while (dependency = REQUIRE_MATCH.exec(source)) {
    dependency = dependency[3]
    dependencies.push(resolveId(dependency, id))
  }
  return dependencies
}
exports.getDependencies = getDependencies

/**
 * Function takes `id` and `source` of module and returns AMD wrapped
 * source with a given `id` as first argument and array of absolute id's
 * required by the given module as second.
 */
function wrapInTransport(id, source) {
  source = String(source)
  var dependencies = getDependencies(id, source)
    , dependsString = ''

  if (dependencies.length) dependsString = '"' + dependencies.join('","') + '"'
  return TRANSPORT_WRAPPER.
    replace('{{id}}', id).
    replace('{{dependencies}}', dependsString).
    split('{{source}}').join(source)
}
exports.wrapInTransport = wrapInTransport
