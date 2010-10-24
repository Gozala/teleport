'use strict'

var fs = require('fs')
,   path = require('path')
,   root = require('npm').dir

,   EXTENSION = '.js'
,   VERSION_MARK = '@'
,   NO_VERSION = 'active'
,   PREFIX = 'package'
,   DESCRIPTOR_FILE = 'package.json'
,   TRANSPORT_WRAPPER = 'define("{{id}}", function(require, exports, module, undefined) { {{source}}\n/**/})\n'
,   NOT_FOUND_ERROR = 'throw new Error("Required module can\'t be found: `{{id}}`")'

var IDDescriptor =
{ packageName: { get: function() {
    return this.toString().split(SEPARATOR)[0]
  }}
, modulePath: { get: function() {
    return this.toString().substr(this.packageName.length + 1)
  }}
, isMain: { get: function() {
    return this.toString() == this.packageName
  }}
, version: { get: function() {
    var string = '' + this
    ,   offset = this.packageName.length
    return string.charAt(offset) == VERSION_MARK ?
      string.substr(offset).split(SEPARATOR)[0] : NO_VERSION
  }}
, path: { get: function() {
    return root + SEPARATOR + this.packageName + SEPARATOR + this.version
      + SEPARATOR + PREFIX + SEPARATOR + this.modulePath
  }}
, topId: { get: function() {
    var version = this.version
    ,   path = this.modulePath
    return this.packageName +
      (version == NO_VERSION ? '' : VERSION_MARK + version) + SEPARATOR +
      (path.substr(-3) == EXTENSION ? path.substr(0, path.length - 3) : path)
  }}
}
function ID(id) {
  return Object.create({ toString: function() { return id } }, IDDescriptor)
}
exports.ID = ID

exports.transport = function transport(path, callback) {
  var id = Object.create(path, ID)
  fs.read(id.path, function(e, data) {
    if (e) data = NOT_FOUND_ERROR.replace('{{id}}', id.topId)
    var source = TRANSPORT_WRAPPER.replace('{{id}}', id.topId)
                                  .replace('{{source}}', data)
    callback(null, data)
 })
}
