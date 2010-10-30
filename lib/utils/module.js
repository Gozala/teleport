'use strict'

var fs =  require('promised-fs')
,   when = require('q').when
,   CONST = require('teleport/strings')

,   root = fs.path(CONST.NPM_DIR)

var IDDescriptor =
{ packageName: { get: function() {
    var name = this.toString().split(CONST.SEPARATOR)[0]
    return name.substr(-3) == CONST.EXTENSION ? name.substr(0, name.length - 3) : name
  }}
, modulePath: { get: function() {
    if (this.isMain) return this.packageName
    var path = this.toString().substr(this.packageName.length + 1)
    return path.substr(-3) == CONST.EXTENSION ? path.substr(0, path.length - 3) : path
  }}
, isMain: { get: function() {
    return 0 > this.toString().indexOf(CONST.SEPARATOR)
  }}
, version: { get: function() {
    var string = '' + this
    ,   offset = this.packageName.length
    return string.charAt(offset) == CONST.VERSION_MARK ?
      string.substr(offset).split(CONST.SEPARATOR)[0] : CONST.VERSION
  }}
, path: { get: function() {
    return String(root.join(this.packageName, this.version, CONST.PREFIX, CONST.LIB, this.modulePath + CONST.EXTENSION))
  }}
, topId: { get: function() {
    var version = this.version
    ,   path = this.modulePath

    version = version == CONST.VERSION ? '' : CONST.VERSION_MARK + version
    var id = this.packageName + version
    if (!this.isMain) id += CONST.SEPARATOR + path
    return id
  }}
}
function ID(id) {
  return Object.create({ toString: function() { return id } }, IDDescriptor)
}
exports.ID = ID

exports.transport = function transport(path, callback) {
  var id = ID(path)
  return when
  ( fs.read(id.path.toString())
  , function(content) {
      return CONST.TRANSPORT_WRAPPER.replace('{{id}}', id.topId)
        .replace('{{source}}', content)
    }
  , function(reason) {
      var content = CONST.NOT_FOUND_ERROR.replace('{{id}}', id.topId)
        .replace('{{path}}', id.path)
      return CONST.TRANSPORT_WRAPPER.replace('{{id}}', id.topId)
        .replace('{{source}}', content)
    }
  )
}
