'use strict'

var fs =  require('promised-fs')
  , packageUtils = require('teleport/utils/package')
  , Trait = require('light-traits').Trait
  , CONST = require('teleport/strings')
  , Q = require('q'), when = Q.when, reject = Q.reject
  , pu = require('promised-utils'), Promised = pu.Promised, all = pu.all
  , PackageModules = require('./module').PackageModules

  , DESCRIPTOR_PATH = fs.join(CONST.VERSION, CONST.PREFIX)
  , DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE
  , JSON_PARSE_ERROR = 'Failed to parse package descriptor: '
  , ERR_NOT_IN_PACKAGE = CONST.ERR_NOT_IN_PACKAGE

/**
 * Finds the root of the project package. Optionally takes `path` in the
 * under the project directory (if not provided `pwd` is used).
 * @param {String} path
 * @returns {Promise(String)}
 */
function getRoot(path) {
  path = path ? fs.Path(String(path)) : fs.workingDirectoryPath()
  return when(path.list(), function(entries) {
    if (0 <= entries.indexOf(DESCRIPTOR_FILE)) return String(path)
    var directory = path.directory()
    if (String(path) == String(directory)) return reject(ERR_NOT_IN_PACKAGE)
    return getRoot(directory)
  })
}
exports.getRoot = Promised.sync(getRoot)

/**
 * Returns promise for the parsed `package.json`.
 */
function getDescriptor(path) {
  return Promised(when(getRoot(path), function(root) {
    return when(fs.read(fs.join(root, DESCRIPTOR_FILE)), JSON.parse)
  }))
}

exports.getDescriptor = getDescriptor
