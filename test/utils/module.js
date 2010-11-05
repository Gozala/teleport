'use strict'

var Module = require('teleport/catalog/module').Module
,   npmDir = require('../fixtures').npmDir

exports.Assert = require('../asserts').Assert

exports['test regular module'] = function(assert) {
  assert.module
  ( Module(
    { id: 'bar/module/xhr+eval'
    , packages: { bar: { name: 'bar' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , path: './lib/module/xhr+eval.js'
    , relative: 'module/xhr+eval'
    }
  , 'test module `bar/module/xhr+eval.js`'
  )
}

exports['test main module'] = function(assert) {
  assert.module
  ( Module(
    { id: 'bar'
    , packages: { 'bar': { name: 'bar', main: './lib/foo' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , main: true
    , name: 'bar'
    , path: './lib/foo.js'
    }
  , 'test module with main property in descriptor'
  )

  assert.module
  ( Module(
    { id: 'foo'
    , packages: { 'foo': { name: 'foo', main: './path/to/bar' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'foo'
    , main: true
    , path: './path/to/bar.js'
    }
  , 'module with main property pointing outside of lib dir.'
  )
}

exports['test versioned package'] = function(assert) {
  assert.module
  ( Module(
    { id: 'bar@0.1.1/baz'
    , packages: { bar: { name: 'bar' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , version: '0.1.1'
    , path: './lib/baz.js'
    }
  , 'module with versioned package name'
  )
}

exports['test custom lib'] = function(assert) {
  assert.module
  ( Module(
    { id: 'bar/test'
    , packages: { bar: { name: 'bar', directories: { lib: 'engine/teleport' } } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , id: 'bar/test'
    , path: './engine/teleport/test.js'
    }
  , 'module with custom lib path'
  )
}

exports['test module alias'] = function(assert) {
  var packages = { bar: { name: 'bar', modules: { foo: './path/to/foo.js' } } }

  assert.module
  ( Module(
    { id: 'bar/test'
    , packages: packages
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , path: './lib/test.js'
    }
  , 'non aliased module form package with aliases'
  )

  assert.module
  ( Module(
    { id: 'bar/foo'
    , packages: packages
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , path: './path/to/foo.js'
    }
  , 'aliased module'
  )
}

if (module == require.main) require('test').run(exports)
