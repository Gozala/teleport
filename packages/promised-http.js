define("promised-http", ["q"], function(require, exports, module, undefined) { 'use strict'

var q = require('q'), when = q.when, defer = q.defer

var GET = 'GET'
,   POST = 'POST'
,   CONTENT_TYPE = 'Content-type'
,   HEADERS = { 'Content-type': 'application/x-www-form-urlencoded' }

function encode(data) {
  var message = ''
  for (var key in data) {
    message += '&' + encodeURIComponent(key) 
    message += '=' + encodeURIComponent(data[key])
  }
  return message.substr(1)
}

exports.request = function request(options) {
  if ('string' == typeof options) options = { url: options }
  var deferred = defer()
  ,   xhr = new XMLHttpRequest()
  ,   url = options.url || ''
  ,   headers = options.headers || HEADERS
  ,   data = options.data || null
  ,   message = data ? encode(data) : null
  ,   method = String(options.method).toUpperCase() == POST ? POST : GET
  ,   mimeType = options.mimeType || null
  ,   isXML = mimeType && 0 <= mimeType.toLowerCase().indexOf('xml')

  if (POST == method) {
    if (!(CONTENT_TYPE in headers))
      headers[CONTENT_TYPE] = HEADERS[CONTENT_TYPE]
  } else if (message) {
    url += "?" + message
    message = null
  }

  if ('username' in options)
    xhr.open(method, url, true, options.username, options.password)
  else xhr.open(method, url, true)

  for (var key in headers) xhr.setRequestHeader(key, headers[key])
  
  if (mimeType) xhr.overrideMimeType(mimeType)

  xhr.onreadystatechange = function state() {
    if (xhr.readyState == 4) {
      if (xhr.status == 0 || xhr.status == 200)
        deferred.resolve(isXML ? xhr.responseXML: xhr.responseText)
      else deferred.reject(
      { at: 'request'
      , message: 'Failed to make XMLHttpRequest'
      , url: url
      , headers: headers
      , data: data
      , method: method
      , status: xhr.status
      , xhr: xhr
      })
    }
  }
  xhr.send(message)

  return deferred.promise
}
 
/**/});