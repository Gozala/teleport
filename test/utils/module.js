'use strict'

var ID = require('teleport/utils/module').ID
,   npm = require('teleport/strings').NPM_DIR

exports['test normal module'] = function(assert) {
  var id = ID('teleport/engine/xhr+eval.js')
  assert.equal(id.packageName, 'teleport', 'package name is a first slice')
  assert.equal(id.version, 'active', 'verision is supposed to be `active`')
  assert.equal(id.isMain, false, 'module is not main')
  assert.equal(id.modulePath, 'engine/xhr+eval', 'module path is correct')
  assert.equal(id.topId, 'teleport/engine/xhr+eval', 'module id is correct')
  assert.equal
  ( id.path
  , npm + '/teleport/active/package/lib/engine/xhr+eval.js'
  , 'module path is generated correctly'
  )
}

exports['test main module'] = function(assert) {
  var id = ID('teleport')
  assert.equal(id.packageName, 'teleport', 'package name is a first slice')
  assert.equal(id.version, 'active', 'verision is supposed to be `active`')
  assert.equal(id.isMain, true, 'module is not main')
  assert.equal(id.modulePath, 'teleport', 'module path is correct')
  assert.equal(id.topId, 'teleport', 'module id is correct')
  assert.equal
  ( id.path
  , npm + '/teleport/active/package/lib/teleport.js'
  , 'module path is generated correctly'
  )
}


if (module == require.main) require('test').run(exports)
