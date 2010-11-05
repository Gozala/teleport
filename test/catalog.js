'use strict'

var when = require('q').when
,   all = require('promised-utils').all
,   npmDir = require('./fixtures').npmDir
,   Catalog = require('teleport/catalog').Catalog
// Mocking npm.dir

,   ERR_NOT_FOUND = 'can\'t be found under the path:'

exports.Assert = require('./asserts').Assert
exports['test catalog with missing dependency'] = function(assert, done) {
  var catalog = Catalog(npmDir.join('missing-dpendency', 'active', 'package'))
  when
  ( catalog
  , function(catalog) {
      done(assert.fail('Catalog can not be build if dependency is missing'))
    }
  , function(reason) {
      assert.ok(/npm install non-existing/g.test(reason), 'catalog is rejected')
      done()
  })
}

exports['test catalog'] = function(assert, done) {
  var catalog = Catalog(npmDir.join('bar', 'active', 'package'))
  when
  ( catalog
  , function(catalog) {
      var packages = catalog.packages
      assert.equal
      ( Object.keys(packages).length
      , 1
      , 'only one package in catalog since bar has no dependencies'
      )
      assert.ok('bar' in packages, 'expected package is in catalog')

      var m1 = catalog.module('bar/foo')
      assert.module
      ( m1
      , { id: 'bar/foo'
        , name: 'bar'
        , dir: npmDir
        , path: './lib/foo.js'
        }
      , '`bar/foo` module has correct metadata'
      )

      var t1 = assert.moduleLoad
      ( m1
      , 'exports.id = \'bar/foo\''
      , 'module `bar/foo` can be loaded'
      )

      m2 = catalog.module('bar/bla.js')
      assert.module
      ( m2
      , { id: 'bar/bla'
        , name: 'bar'
        , dir: npmDir
        , path: './lib/bla.js'
        }
      , '`bar/bla` module has correct metadata'
      )

      var t2 = assert.moduleLoad
      ( m2
      , ERR_NOT_FOUND
      , 'module `bar/bla` can not be loaded'
      )

      when(all([t1, t2]), done, done)
    }
  , function(error) {
      done(assert.fail('building catalog failed:\n' + error))
    }
  )
}

if (module == require.main) require('test').run(exports)
