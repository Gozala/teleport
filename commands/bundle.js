'use strict'

var fs = require('promised-fs')
,   when = require('q').when
,   pu = require('promised-utils'), Promised = pu.Promised, all = pu.all
,   CONST = require('../strings')

,   PACKAGES_DIR = CONST.PACKAGES_DIR
,   EXTENSION = CONST.EXTENSION
,   TELEPORT_CORE_FILE = CONST.TELEPORT_CORE_FILE

,   lib = fs.Path(module.filename).directory().directory()
,   core = lib.join(TELEPORT_CORE_FILE).read()
,   engine = lib.join(CONST.ENGINES_DIR, CONST.TELEPORT_ENGINE_FILE).read()
,   teleport = Promised.sync(String.prototype.concat).apply('', [core, engine])

exports.bundle = function bundle(main) {
  return when
  ( when
    ( new Catalog()
    , function ready(catalog) {
        return when
        // Writing scrapped module and all it's dependencies.
        ( write(catalog, catalog.module(main).transport)
        // Writing teleport loader.
        , function () {
            return catalog.root.join(PACKAGES_DIR, TELEPORT_CORE_FILE).write(teleport)
          }
        )
      }
    )
  , function done() { console.log('Done') }
  , console.error
  )
}

var write = Promised(function(catalog, transport, visited) {
  if (!Array.isArray(visited)) visited = []
  var path = catalog.root.join(PACKAGES_DIR).join(transport.id + EXTENSION)
  ,   dir = path.directory()
  ,   tasks = []
  // If we have not created module container directory yet creating it and
  // adding a promise to the tracked task list.
  tasks.push(when(dir.makeTree(), function directoryCreated() {
    // Writing wrapped module once directory have been created.
    return path.write(String(transport))
  }))
  // Writing wrapped file once directory is ready.
  //else tasks.push(path.write(String(transport)))
  // Writing all the non yet written dependencies of the passed module and
  // adding promises to the tracked task list.
  transport.dependencies.forEach(function(id) {
    if (0 <= visited.indexOf(id)) return
    visited.push(id)
    tasks.push(write(catalog, catalog.module(id).transport, visited))
  })
  // Returning promise for all the tasks.
  return all(tasks)
})
