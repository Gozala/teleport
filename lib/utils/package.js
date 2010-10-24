'use strict'

var fs = require('fs')

,   cwd = process.cwd()

,   SEPARATOR = '/'
,   DESCRIPTOR_FILE = 'package.json'

exports.path = function path(callback, currentPath) {
  currentPath = undefined == currentPath ? cwd : currentPath
  fs.readdir(currentPath, function(e, files) {
    if (e) return callback(e)
    if (0 <= files.indexOf(DESCRIPTOR_FILE)) return callback(null, currentPath)
    path(callback, currentPath.substr(0, currentPath.lastIndexOf(SEPARATOR)))
  })
}
