'use strict'

var p = require('../../engines/common/utils/package')

exports.Assert = require('../asserts').Assert

exports['test descriptor template'] = function (assert) {
  var d1 = p.DescriptorTemplate()
  var d2 = p.DescriptorTemplate()
  
  assert.equal(d1.name, d2.name, 'names are equal')
  assert.notEqual(d1.directories, d2.directories, 'directories are not equal')
}

exports['test ensureField'] = function (assert) {
  var d = {}
  assert.ok('name' in p.ensureField(d, 'name'), '`name` field is added')
  assert.equal(p.ensureField(d, 'name'), d, 'ensureField returns descriptor')
}

exports['test ensureOverlay'] = function (assert) {
  var d = {}, name = 'teleport'

  assert.equal(p.ensureOverlay(d, name), d, 'returns same descriptor')
  assert.ok('overlay' in d, 'contains overlay field')
  assert.ok(name in d.overlay, 'contains desired overlay')
  assert.equal(d.overlay[name], p.ensureOverlay(d, name).overlay[name],
               'overlay is not overided')
}

exports['test normalizeOverlay'] = function (assert) {
  var overlay, name = 'teleport', d = {
    name: 'foo',
    main: './lib/foo',
    version: '0.0.1',
    scripts: { foo: 'bar' }
  }
  
  assert.equal(p.normalizeOverlay(d, name), d, 'same descriptor returned')
  assert.equal(d.name, 'foo', 'name is preserved')

  overlay = d.overlay[name]

  assert.equal(overlay.name, d.name, 'name is copied to overlay')
  assert.equal(overlay.version, d.version, 'verision is copied to overlay')
  assert.equal(overlay.main, d.main, 'main is copied to overlay')
  assert.ok('modules' in overlay, 'modules defined from defaults')
  assert.ok(!('dependencies' in overlay), 'no defaults for dependencies')
  assert.equal(overlay.directories.lib, './lib', 'default directories')
  assert.notEqual(overlay.scripts, d.scripts, 'fields are not just references')
  assert.equal(overlay.scripts.foo, d.scripts.foo, 'fields copied with values')
  
  overlay.scripts.bar = 'bzz'
  assert.ok(!('bar' in d.scripts), 'field value changes do not delegate')

  p.normalizeOverlay(d, name)

  assert.equal(overlay.scripts.bar, 'bzz', 'normalization does not overrides')
}

exports['test addModuleAliases'] = function (assert) {
  var name = 'teleport', d = {
    modules: {
      'foo': 'bar',
      'baz': 'bzz'
    }
  }

  var overlay = p.normalizeOverlay(d, name).overlay[name]
  
  var aliases = {
    'foo': 'baz2',
    'a': 'b',
    'c': 'd/e'
  }

  assert.equal(p.addModuleAliases(overlay, aliases), overlay,
               'returns given descriptor')
  assert.equal(d.modules.foo, overlay.modules.foo,
               'overlay has same module alias')
  assert.equal(overlay.modules.foo, 'bar', 'alais is not overriden')
  assert.equal(overlay.modules.a, 'b', 'new alias is added')
  assert.ok(!('a' in d.modules), 'alias added only to overlay')
}

if (module == require.main) require('test').run(exports)
