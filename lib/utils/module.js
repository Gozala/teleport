'use strict'

var fs = require('fs')
,   path = require('path')
,   root = require('npm').dir

,   EXTENSION = '.js'
,   VERSION_MARK = '@'
,   NO_VERSION = 'active'
,   PREFIX = 'package/lib/'
,   DESCRIPTOR_FILE = 'package.json'
,   TRANSPORT_WRAPPER = 'define("{{id}}", function(require, exports, module, undefined) { {{source}} /**/});'
,   SEPARATOR = '/'
,   NOT_FOUND_ERROR = 'throw new Error("Required module `{{id}}` can\'t be found under the path: `{{path}}`")'

var IDDescriptor =
{ packageName: { get: function() {
    return this.toString().split(SEPARATOR)[0]
  }}
, modulePath: { get: function() {
    if (this.isMain) return this.packageName
    var path = this.toString().substr(this.packageName.length + 1)
    return path.substr(-3) == EXTENSION ? path.substr(0, path.length - 3) : path
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
    return path.join(root, this.packageName, this.version, PREFIX, this.modulePath + EXTENSION)
  }}
, topId: { get: function() {
    var version = this.version
    ,   path = this.modulePath

    version = version == NO_VERSION ? '' : VERSION_MARK + version
    var id = this.packageName + version
    if (!this.isMain) id += SEPARATOR + path
    return id
  }}
}
function ID(id) {
  return Object.create({ toString: function() { return id } }, IDDescriptor)
}
exports.ID = ID

exports.transport = function transport(path, callback) {
  var id = ID(path)
  fs.readFile(id.path, function(e, data) {
    if (e) data = NOT_FOUND_ERROR.replace('{{id}}', id.topId)
                                 .replace('{{path}}', id.path)
    var source = TRANSPORT_WRAPPER.replace('{{id}}', id.topId)
                                  .replace('{{source}}', data)
    callback(null, source)
 })
}
