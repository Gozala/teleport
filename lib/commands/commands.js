'use strict'

var activate = require('./activate').activate
,   init = require('./init').init
,   args = require('system').args.splice(2)
,   CONST = require('teleport/settings')

,   command = args[0]
,   params = args.slice(1)

switch (command) {
  case 'activate':
    activate.apply(null, params)
    break
  case 'init':
    init.apply(null, params)
    break
  default:
    console.log(CONST.ERR_NO_COMMAND)
}
