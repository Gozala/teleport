'use strict'

var owns = Function.prototype.call.bind(Object.prototype.hasOwnProperty)

/**
 * Creates default package descriptor object, where all the optional property
 * values are equal to `null`.
 */
function DescriptorTemplate() {
  return {
    name: '{{name}}',
    version: '{{version}}',
    description: '{{description}}',
    keywords: [],
    homepage: null,
    author: null,
    contributors: null,
    // files: null,
    main: null,
    // bin: null,
    modules: {},
    // man: null,
    directories: {
      lib: './lib'
    },
    repository: null,
    scripts: {},
    dependencies: null
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
  var defaultFields = DescriptorTemplate();
  // Now that we are sure that we have required overlay we go and copy all
  // the supported descriptor fields that are not yet present in desired
  // overlay.
  Object.keys(defaultFields).forEach(function(name) {
    // If overlay hos no property and it's contained in package descriptor
    // or it's a truthy value in defaults copy it over to overlay.
    if (!owns(overlay, name) && (descriptorFields[name] || defaultFields[name]))
      overlay[name] = descriptorFields[name] || defaultFields[name]
  })
  return descriptor
}
exports.normalizeOverlay = normalizeOverlay

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

/**
 * Adds not yet existing module aliases to the given package `descriptor`
 * from the given `aliases` map.
 * @param {JSON} descriptor
 *    Package descriptor.
 * @param {JSON} aliases
 *    Map of module aliases (relative_id -> relative_path).
 */
function addModuleAliases(descriptor, aliases) {
  var modules = ensureField(descriptor, 'modules').modules
  Object.keys(aliases).forEach(function(name) {
    if (!owns(modules, name)) modules[name] = aliases[name]
  })
  return descriptor
}
exports.addModuleAliases = addModuleAliases
