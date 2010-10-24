'use strict'

var activate = require('./activate').activate
,   init = require('./init').init
,   args = require('system').args.splice(2)

,   command = args[0]
,   params = args.slice(1)
// constants
,   HELP = 'Not sure what do you mean by that!!'

switch (command) {
  case 'activate':
    activate.apply(null, params)
    break
  case 'init':
    init.apply(null, params)
    break
  default:
    console.log(HELP)
}
