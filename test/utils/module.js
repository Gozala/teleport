'use strict'

var Module = require('teleport/catalog/module').Module
,   npmDir = require('../fixtures').npmDir

exports.Assert = require('../asserts').Assert

exports['test regular module'] = function(assert) {
  assert.module
  ( Module(
    { url: 'bar/module/xhr+eval.js'
    , packages: { bar: { name: 'bar' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , id: 'bar/module/xhr+eval'
    , path: './lib/module/xhr+eval.js'
    , relative: 'module/xhr+eval'
    }
  , 'test module `bar/module/xhr+eval.js`'
  )
}

exports['test main module'] = function(assert) {
  assert.module
  ( Module(
    { url: 'bar.js'
    , packages: { 'bar': { name: 'bar', main: './lib/foo' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , id: 'bar'
    , main: true
    , name: 'bar'
    , path: './lib/foo.js'
    }
  , 'test module with main property in descriptor'
  )

  assert.module
  ( Module(
    { url: 'foo.js'
    , packages: { 'foo': { name: 'foo', main: './path/to/bar.js' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , id: 'foo'
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
    { url: 'bar@0.1.1/baz.js'
    , packages: { bar: { name: 'bar' } }
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , version: '0.1.1'
    , id: 'bar@0.1.1/baz'
    , path: './lib/baz.js'
    }
  , 'module with versioned package name'
  )
}

exports['test custom lib'] = function(assert) {
  assert.module
  ( Module(
    { url: 'bar/test.js'
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
    { url: 'bar/test.js'
    , packages: packages
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , id: 'bar/test'
    , path: './lib/test.js'
    }
  , 'non aliased module form package with aliases'
  )

  assert.module
  ( Module(
    { url: 'bar/foo.js'
    , packages: packages
    , packagesPath: npmDir
    })
  , { dir: npmDir
    , name: 'bar'
    , id: 'bar/foo'
    , path: './path/to/foo.js'
    }
  , 'aliased module'
  )
}

if (module == require.main) require('test').run(exports)
