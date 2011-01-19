'use strict'

exports['test module utils'] = require('./utils/module')
exports['test package utils'] = require('./utils/package')

if (module == require.main) require('test').run(exports)
