define("system", [], function(require, exports, module, undefined) { 'use strict'

var env = {}
,   args = []
,   listeners = []
,   params = window.location.search.substr(1).split('&')
,   ignore = Function()

for (var i = 0, ii = params.length; i < ii; i++) {
  var parts = params[i].split('=')
  ,   key = decodeURIComponent(parts[0])
  ,   value = decodeURIComponent(parts[1])
  if (key) {
    args.push(key)
    if (value) args.push(env[key] = value)
  }
}

window.addEventListener('hashchange', function(e) {
  for (var i = 0, ii = listeners.length; i < ii; i++) {
    try {
      listeners[i](decodeURIComponent(window.location.hash.substr(1)))
    } catch(e) {}
  }
}, false)

exports.engine = 'teleport'
exports.env = env
exports.args = args
exports.print = 'undefined' === typeof console ? ignore : function print() {
  console.log.apply(console, arguments)
}

exports.stdout = { write: exports.print }
exports.stdin =
{ setEncoding: ignore
, removeListener: function removeListener(event, listener) {
    var index = -1
    if ('data' == event && 0 <= (index = listeners.indexOf(listener)))
      listeners.splice(index, 1)
  }
, on: function on(event, listener) {
    if ('data' == event && 0 > listeners.indexOf(listener))
      listeners.push(listener)
  }
}
 
/**/});