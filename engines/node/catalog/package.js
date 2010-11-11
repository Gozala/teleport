'use strict'

var fs = require('promised-fs')
,   CONST = require('teleport/strings')
,   q = require('q'), when = q.when, reject = q.reject

, ERR_NOT_IN_PACKAGE = CONST.ERR_NOT_IN_PACKAGE
, DESCRIPTOR_FILE = CONST.DESCRIPTOR_FILE

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
    path.join(DESCRIPTOR_FILE).read()
  })
}
