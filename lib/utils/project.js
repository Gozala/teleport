'use strict'

var meta = require('./package')
,   fs = require('fs')
,   path = require('path')

, DESCRIPTOR = 'package.json'

function analize(callback) {
  meta.path(function(e, root) {
    if (e) return callback(e)
    fs.readFile(path.join(root, DESCRIPTOR), function(e, data) {
      if (e) return = callback(e)
      try {
        var project = JSON.parse(data)
        if ('teleport' in project.engines) {
          dependencies(
      } catch(e) {
        callback(e)
      }
    })
  })
}
