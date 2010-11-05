'use strict'

var fs = require('promised-fs')
,   when = require('q').when
,   Promised = require('promised-utils').Promised
,   Catalog = require('teleport/catalog').Catalog
,   CONSTS = require('teleport/strings')

,   PACKAGES = CONSTS.PACKAGES
,   EXTENSION = CONSTS.EXTENSION

exports.bundle = function bundle(main) {
  when
  ( new Catalog()
  , function ready(catalog) {
      return write.call(catalog, catalog.module(main).transport)
    }
  , function failed(error) {
      console.error(error)
    }
  )
}


var write = Promised(function bundle(transport, callback) {
  var path = this.root.join('packages').join(transport.id + EXTENSION)
  console.log('mktree:', String(path.directory()))
  console.log('write: ', String(path))
  transport.dependencies.forEach(function(id) {
    var dependency = this.module(id).transport
    write.call(this, dependency)
  }, this)
})


