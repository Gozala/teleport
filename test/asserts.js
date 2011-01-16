'use strict'

var when = require('q').when
,   AssertBase = require('test/assert').Assert

exports.Assert = function Assert() {
  return Object.create(AssertBase.apply(null, arguments), AssertDescriptor)
}

function containsSet(source, target) {
  return source.every(function(element) {
    return ~ target.indexOf(element)
  })
}

var AssertDescriptor =
{ equivalentSet: { value: function equivalentSet(actual, expected, message) {
    if (actual.length === expected.length && containsSet(actual, expected))
      this.pass(message)
    else
      this.fail({
        message: message,
        actual: actual,
        expected: expected,
        operator: 'equivalentSet'
      })
  }}
, module: { value: function module(actual, expected, message) {
    this.deepEqual
    ( { packageName: actual.packageName
      , version: actual.version
      , path: String(actual.path)
      , relativeId: actual.relativeId
      }
    , { packageName: expected.name
      , version: expected.version || ''
      , relativeId: expected.relativeId || actual.id.substr(actual.id.indexOf('/') + 1)
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
          console.error(e)
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
