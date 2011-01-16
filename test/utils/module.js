'use strict'

var m = require('teleport/module')

exports['test package name'] = function (assert) {
  var getPackageName = m.getPackageName
  assert.equal(getPackageName('foo/bar/baz'), 'foo', 'simple module')
  assert.equal(getPackageName('bar/baz.js'), 'bar', 'with extension')
  assert.notEqual(getPackageName('./bla/bar.js'), 'bla', 'not from relative')
  assert.notEqual(getPackageName('baz.js'), 'baz', 'not from path')
}

exports['test package version'] = function (assert) {
  var getPackageVersion = m.getPackageVersion
  assert.equal(getPackageVersion('foo/bar'), '', 'no version')
  assert.equal(getPackageVersion('foo@0.0.1/bar'), '0.0.1', 'version')
}

exports['test main module id'] = function (assert) {
  var isMainModule = m.isMainModule
  assert.ok(isMainModule('foo'), 'main module')
  assert.ok(isMainModule('foo.js'), 'main module path')
  assert.ok(!isMainModule('foo/bar'), 'nested module')
}

exports['test relative moduel id'] = function (assert) {
  var isModuleIdRelative = m.isModuleIdRelative
  assert.ok(isModuleIdRelative('./foo'), 'id relative to current')
  assert.ok(isModuleIdRelative('../foo'), 'id relative to parent')
  assert.ok(!isModuleIdRelative('foo/bar'), 'absolute id')
}

exports['test find package relative id'] = function (assert) {
  var getPackageRelativeId = m.getPackageRelativeId
  assert.equal(getPackageRelativeId('foo/bar/baz'), 'bar/baz', 'simple')
  assert.equal(getPackageRelativeId('foo@0.2.33/bar'), 'bar', 'versioned')
  assert.equal(getPackageRelativeId('bla/baz.js'), 'baz.js', 'with extension')
}

exports['test find extension'] = function (assert) {
  var getExtension = m.getExtension
  assert.equal('.js', getExtension('foo/bar.js'), 'with extension');
  assert.equal('', getExtension('foo/bar'), 'without extension');
}

exports['test module id resolutions'] = function (assert) {
  var resolveId = m.resolveId;
  assert.equal(resolveId('./foo', 'bar/baz'), 'bar/foo', 'same level')
  assert.equal(resolveId('bla', 'foo/bar'), 'bla', 'absolute')
  assert.equal(resolveId('../foo', 'bar/baz/bla'), 'bar/foo', 'parent level')
  assert.equal(resolveId('../foo/./bar', 'foo/bar'), 'foo/bar', 'messy id')
}

exports['test find dependencies'] = function (assert) {
  var getDependencies = m.getDependencies;
}

if (module == require.main) require('test').run(exports)
