'use strict'

var when = require('q').when
,   AssertBase = require('test/assert').Assert

exports.Assert = function Assert() {
  return Object.create(AssertBase.apply(null, arguments), AssertDescriptor)
}
var AssertDescriptor =
{ module: { value: function module(actual, expected, message) {
    this.deepEqual
    ( { id: actual.id
      , packageName: actual.packageName
      , version: actual.version
      , path: String(actual.path)
      , relativeId: actual.relativeId
      }
    , { id: expected.id
      , packageName: expected.name
      , version: expected.version || ''
      , relativeId: expected.relativeId || expected.id.substr(expected.id.indexOf('/') + 1)
      , path: String(expected.dir.join
        ( expected.name
        , expected.version || 'active'
        , 'package'
        ).join(expected.path))
      }
    , message || 'modules are equal'
    )
  }}
, moduleLoad: { value: function content(actual, expected, message) {
    var assert = this
    return when
    ( actual.transport
    , function moduleResolved(source) {
        // content that should be in the module source
        var content = typeof expected == 'string' ? expected : expected.content
        content = content || ' '
        try {
          function define(id, dependencies, factory) {
            if ('undefined' == typeof factory) {
              if ('undefined' == typeof dependencies) {
                dependencies = id
                id = undefined
              }
              factory = dependencies
              dependencies = undefined
            }
            assert.deepEqual
            ( { id: id
              , dependencies: dependencies
              , module: 'is a ' + typeof factory
              , 'source matches': 0 <= factory.toString().indexOf(content)
              }
            , { id: actual.id
              , dependencies: expected.dependencies || actual.dependencies
              , module: 'is a function'
              , 'source matches': true
              }
            , message
            )
          }
          eval(source)
        } catch(e) {
          assert.fail({ message: message || e.message })
        }
      }
    , function moduleRejected(reason) {
        this.fail(
        { message: '`module.transport` was rejected with reason: '
          + reason.message || reason
        , operator: 'moduleLoad'
        })
      }
    )
  }}
}
