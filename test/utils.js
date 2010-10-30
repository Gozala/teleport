'use strict'

// Mocking npm.dir
var fixtures = require('./fixtures')

exports['test module'] = require('./utils/module')

if (module == require.main) require('test').run(exports)
