'use strict'

exports['test module'] = require('./utils/module')

if (module == require.main) require('test').run(exports)