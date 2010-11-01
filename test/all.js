'use strict'

exports['test utils'] = require('./utils')
exports['test catalog'] = require('./catalog')

if (module == require.main) require('test').run(exports)
