#!/usr/bin/env node

'use strict'

var activate = require('teleport/commands/activate').activate
,   bundle = require('teleport/commands/bundle').bundle
,   reflect = require('teleport/commands/reflect').reflect
,   args = require('system').args.splice(2)
,   CONST = require('teleport/strings')

,   command = args[0]
,   params = args.slice(1)

switch (command) {
  case 'activate':
    activate.apply(null, params)
    break
  case 'bundle':
    bundle.apply(null, params)
    break
  case 'reflect':
    reflect.apply(null, params)
    break
  default:
    console.log(CONST.ERR_NO_COMMAND)
}
