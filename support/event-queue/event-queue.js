define("event-queue/event-queue", ["timer"], function(require, exports, module, undefined) { 'use strict'

const timer = require("timer")
exports.setTimeout = timer.setTimeout
exports.setInterval = timer.setInterval
exports.clearTimeout = timer.clearTimeout
exports.clearInterval = timer.clearInterval
exports.enqueue = timer.setTimeout
 
/**/});