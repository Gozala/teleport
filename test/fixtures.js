var fs = require('promised-fs')

exports.testDir = fs.directory(module.filename)
exports.fixturesDir = fs.join(exports.testDir, 'fixtures')
exports.npmDir = fs.Path(exports.fixturesDir).join('npm')
// Mocking npm dir.
require('teleport/strings').NPM_DIR = exports.npmDir.toString()
