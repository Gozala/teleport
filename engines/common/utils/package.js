'use strict'

var owns = require("core-utils").owns
var utils = require("core-utils/object"),
            merge = utils.merge,
            supplement = utils.supplement

/**
 * Creates default package descriptor object, where all the optional property
 * values are equal to `null`.
 */
function DescriptorTemplate() {
  return {
    name: '{{name}}',
    version: '{{version}}',
    description: '{{description}}',
    format: 'raw',
    keywords: [],
    // files: null,
    // bin: null,
    modules: {},
    // man: null,
    directories: {
      lib: './lib'
    },
    dependencies: {},
    files: [""],
    scripts: {},
    ignore: [".git"]
  }
}
exports.DescriptorTemplate = DescriptorTemplate

/**
 * Function ensures that given `descriptor` contains `overlay` field and
 * an overlay with a given `name`. Function will create them if not yet
 * exists.
 * @param {JSON} descriptor
 *    Package descriptor.
 * @param {String} name
 *    Name of the overlay.
 */
function ensureOverlay(descriptor, name) {
  // Adding `overlay` field to a descriptor if does not contains one yet.
  ensureField(descriptor, 'overlay')
  // Adding overlay with given `name` if it's not defined yet.
  ensureField(descriptor.overlay, name)
  return descriptor
}
exports.ensureOverlay = ensureOverlay

/**
 * Mixes all the package descriptor fields into overlay (does not overrides
 * existing fields). If overlay does not exists in a given package descriptor
 * it will be created and then mixed.
 * @param {JSON} descriptor
 *    Package descriptor.
 * @param {String} name
 *    Name of the overlay.
 */
function normalizeOverlay(descriptor, name) {
  // Ensuring that we have desired overlay in a given package `descriptor`.
  var overlay = ensureOverlay(descriptor, name).overlay[name]
  // Creating clone of the package descriptor from which we will copy all
  // the fields to the overlay. We use clone since we don't want to propagate
  // field changes in the overlay to main descriptor.
  var descriptorFields = JSON.parse(JSON.stringify(descriptor))
  // Removing overlay field since it will make no sense in overlay itself.
  delete descriptorFields.overlay
  normalizeDescriptor(supplement(overlay, descriptorFields))
  return descriptor
}
exports.normalizeOverlay = normalizeOverlay

function normalizeDescriptor(descriptor) {
  descriptor = merge(descriptor, DescriptorTemplate())
  // If descriptor contains `main` field, it's an alias to the main module that
  // we add to the `modules` field if it is not already there.
  if (owns(descriptor, 'main')) addModuleAlias(descriptor, "", descriptor.main)
  return descriptor
}
exports.normalizeDescriptor = normalizeDescriptor

/**
 * Function ensures that given package `descriptor` contains field with a
 * given `name`. If not it will be created with a value `{}`.
 * @param {JSON} descriptor
 *    Package descriptor.
 * @param {String} name
 *    Name of the desired field.
 */
function ensureField(descriptor, name) {
  if (!owns(descriptor, name)) descriptor[name] = {}
  return descriptor
}
exports.ensureField = ensureField

function addModuleAlias(descriptor, alias, path) {
  var modules = ensureField(descriptor, 'modules').modules
  if (!owns(modules, alias)) modules[alias] = path
  return descriptor
}
exports.addModuleAlias = addModuleAlias

/**
 * Adds not yet existing module aliases to the given package `descriptor`
 * from the given `aliases` map.
 * @param {JSON} descriptor
 *    Package descriptor.
 * @param {JSON} aliases
 *    Map of module aliases (relative_id -> relative_path).
 */
function addModuleAliases(descriptor, aliases) {
  Object.keys(aliases).forEach(function(alias) {
    addModuleAlias(descriptor, alias, aliases[alias])
  })
  return descriptor
}
exports.addModuleAliases = addModuleAliases
