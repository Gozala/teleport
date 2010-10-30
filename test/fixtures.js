var path = require('path')

exports.testDir = path.dirname(module.filename)
exports.fixturesDir = path.join(exports.testDir, 'fixtures')
// Mocking npm dir.
require('teleport/strings').NPM_DIR = path.join(exports.fixturesDir, 'npm')
