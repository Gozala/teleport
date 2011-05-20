/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true
         forin: true latedef: false supernew: true globalstrict: true */
/*global define: true */


'use strict';

var connect = require('connect')
var path = require('path')
var teleport = require('./app').teleport

exports.activate = function activate() {
  var path = process.cwd()
  teleport(path, function onReady(error, teleport) {
    if (error) return console.error(error);
    connect(
      connect.static(path),
      connect.static(teleport.dashboard),
      connect.router(teleport.router())
    ).listen(4747)
  })
}
