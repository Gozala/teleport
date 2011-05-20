/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false  globalstrict: true */
/*global define: true */

"use strict";

var path = require('path')
var modules = require('module')
var npm = require('npm')
var readInstalled = require('npm/lib/utils/read-installed')
var fs = require('fs')


/**
 * This function takes json data returned by npm's `readInstalled` and cleans
 * it up from circular references so that `JSON.stringify` can be called on it.
 */
function Metadata(data) {
  delete data.parent;
  if (data.dependencies) {
    Object.keys(data.dependencies).forEach(function(name) {
      Metadata(data.dependencies[name]);
    });
  }
  return data;
}
exports.Metadata = Metadata

function Module(id, parent) {
  this.parent = parent
  this.id = id
  this.filename = modules._resolveFilename(id, parent)[0]
  this.paths = modules._nodeModulePaths(path.dirname(this.filename))
}
Module.prototype.resolve = function resolve(id) {
  return new Module(id, this)
}
Module.prototype.toString = function toString() {
  return fs.readFileSync(this.filename).toString()
}
exports.Module = Module

function Teleport(data) {
  this.metadata = new Metadata(data)
  this.dashboard = path.resolve(module.id, '../node_modules/teleport-dashboard')
  this.module = Object.create(Module.prototype, {
    parent: { value: null },
    id: { value: '/' },
    filename: { value: '.' },
    paths: {
      value: [
        data.path,
        path.join(data.path, 'node_modules'),
        this.dashboard,
        path.join(this.dashboard, 'node_modules'),
      ]
    }
  })
  console.log(this.module.paths)
}
exports.Teleport = Teleport
Teleport.prototype.router = function router(path) {
  path = path || '/support'
  var teleport = this
  return function router(app) {
    app.get(path + '/metadata.json', function onMeta(request, response, next) {
      response.end(JSON.stringify(teleport.metadata, '', '  '))
    })
    app.get(path + '/*.js', function onModule(request, response, next) {
      var id = request.params[0]
      try {
        var source = '!define(function(require, exports, module, undefined, define) { ' +
                     teleport.resolve(id).toString() +
                     '\n/**/});'
          response.end(source)
      } catch (error) {
        response.end(JSON.stringify(error))
      }
    })
  }
}
Teleport.prototype.resolve = function resolve(id, base) {
  return this.module.resolve(id)
}

exports.teleport = function teleport(path, callback) {
  npm.load(function onLoad(error) {
    if (error) return callback(error)
    readInstalled(path,  function onRead(error, data) {
      if (error) return callback(error)
      callback(error, new Teleport(data))
    })
  })
}
