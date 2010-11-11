define("event-queue", [], function(require, exports, module, undefined) { 'use strict'

var tasks = []
,   EVENT_TYPE = 'commonjs:event-queque:next-tick'

exports.setTimeout = window.setTimeout
exports.setInterval = window.setInterval
exports.clearTimeout = window.clearTimeout
exports.clearInterval = window.clearTimeout
exports.enqueue = function enqueue(task) {
  tasks.push(task)
  window.postMessage(EVENT_TYPE, '*')
}
window.addEventListener('message', function nextTick(event) {
  if (event.source == window && EVENT_TYPE == event.data) {
    var pending = tasks.splice(0)
    ,   task
    while(task = pending.shift()) try { task() } catch(e) { console.error(e) }
  }
}, true)
 
/**/});