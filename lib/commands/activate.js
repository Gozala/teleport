'use strict'

var project = require('teleport/utils/package')
,   service = require('teleport/utils/service')

,   ERR_NO_PACKAGE = 'Teleport can be only activated form a package'

exports.activate = function(path) {
  project.path(function(e, path) {
    if (e) return console.log(ERR_NO_PACKAGE)
    service.activate(path)
    console.log('Teleport is activated')
  }, path)
}
