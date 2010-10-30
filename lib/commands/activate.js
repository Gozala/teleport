'use strict'

var project = require('teleport/utils/package')
,   service = require('teleport/utils/service')
,   CONST = require('teleport/settings')

exports.activate = function(path) {
  project.path(function(e, path) {
    if (e) return console.log(CONST.ERR_PACKAGE_NOT_FOUND)
    service.activate(path)
    console.log(CONST.STR_ACTIVE)
  }, path)
}
