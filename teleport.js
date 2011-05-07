/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true browser: true
         forin: true, eqnull: true latedef: false supernew: true */
/*global define: true */

// CommonJS AMD 1.1 loader.
(function(require, exports, module, undefined) {
  var isInteractiveMode, isArray, isString,

      COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g,
      REQUIRE_MATCH = /(^|[^\w\_])require\s*\(('|")([\w\W]*?)('|")\)/g
  
  // IE (at least 6-8) do not dispatches `'load'` events on script elements
  // after execution, but `readyState` property value of such script elements
  // is `'interactive'`, which we default to in case `addEventListener` is
  // not defined.
  isInteractiveMode = !('addEventListener' in document)

  isString = function isString(value) { return 'string' === typeof value }
  isArray = Array.isArray || function isArray(value) {
    return '[object Array]' === Object.prototype.toString.call(value)
  }

  function getId() {
    var script, scripts = document.getElementsByTagName('script'),
        l = scripts.length;

    while ((script = scripts[--l])) {
      if ('interactive' === script.readyState)
        return script.getAttribute('data-id')
    }
  }

  function isRelative(uri) { return uri.charAt(0) === '.' }

  function getPluginName(id) {
    var index = id.indexOf('!')
    return index > 0 ? id.substr(0, index) : ''
  }

  function getPluginUri(id) {
    var index = id.indexOf('!')
    return ~index ? id.substr(++index) : id
  }

  /**
   * Resolves relative module ID to an absolute id.
   * @param {String} id
   *    relative id to be resolved
   * @param {String} baseId
   *    absolute id of a requirer module
   * @return {String}
   *    absolute id
   */
  function resolve(uri, base) {
    var path, paths, root, extension;
    // If given `uri` is not relative or `base` uri is not provided we do not
    // resolve anything.
    if (!base || !isRelative(uri)) return uri;
    base = base.split('/');
    paths = uri.split('/');
    root = paths[0];
    if (base.length > 1) base.pop();
    while ((path = paths.shift())) {
      if (path === '..' && base.length) base.pop();
      else if (path !== '.') base.push(path);
    }
    return base.join('/');
  }

  /**
   * Function takes `id` and `source` of module and returns array of absolute
   * id's of modules that are required by a given module. (function does naive
   * parsing of source to find all the `require` statements and resolves all the
   * relative id's in it to a given `id`).
   * @param {String} id
   *    Absolute id of a module.
   * @param {String()} source
   *    Source of a module.
   * @returns {String[]}
   */
  function getDependencies(uri, source) {
    var dependency, dependencies = [];
    // strip out comments to ignore commented `require` calls.
    source = String(source).replace(COMMENTS_MATCH, '')
    while ((dependency = REQUIRE_MATCH.exec(source))) {
      dependency = resolve(dependency[3], uri)
      if (!~dependencies.indexOf(dependency))
        dependencies.push(dependency)
    }
    return dependencies
  }

  function Module(options) {
    var module
    if (!options) return this
    if (!(module = options.cache[options.id])) {
      module = new Module
      module.observers = options.observers || []
      module.meta = options.meta || {}
      module.id = module.meta.id = options.id
      module.uri = module.meta.uri = options.uri
      module.meta.exports = options.exports || {}
      module.plugin = options.plugin
      module = options.cache[module.id] = module
    }
    return module;
  }
  Module.prototype.isLoaded = false;
  Module.prototype.isLoading = false;
  Module.prototype.falure = null;
  Module.prototype.load = function load(success, failure) {
    if (this.isLoaded) return success && success(this.meta.exports)
    else if (this.failure) return failure && failure(this.failure)
    else this.observers.push([ success, failure ])
    
    if (!this.isLoading) this.plugin.load(this)
    this.isLoading = true
  }
  Module.prototype.compile = function compile() {
    if (this.plugin && this.plugin.compile)
      this.plugin.compile(this)
    else
      // TODO: Fix this hack
      Loader.prototype.evaluate(this)
  }
  Module.prototype.evaluate = function evaluate() {
    if (this.plugin.evaluate)
      this.plugin.evaluate(this)
  }
  Module.prototype.reject = function reject(error) {
    this.failure = error
    this.complete()
  }
  Module.prototype.resolve = function resolve() {
    this.isLoaded = true
    this.complete()
  }
  Module.prototype.complete = function complete() {
    var observer, observers = this.observers
    this.observer = this.plugins = null
    while ((observer = observers.shift())) {
      if ((observer = observer[this.isLoaded ? 0 : 1]))
        observer(this.isLoaded ? this.meta.exports : this.error)
    }
  }

  function load(plugin, module) {
    plugin.load(module)
  }

  function Loader(options) {
    var loader, plugins, cache, anonymous;
    loader = this;
    cache = loader.cache = {};
    plugins = loader.plugins = { };
    anonymous = loader.anonymous = [];

    loader.onInject = function onInject(event) {
      var element, id, deferred
      element = event.currentTarget || event.srcElement
      element.removeEventListener('load', onInject, false)
      id = element.getAttribute('data-id')
      // Define deferred module only if it has not been defined yet. In some
      // cases modules with explicit id's can be used in mix with anonymous
      // modules and we should only handle anonymous ones.
      if (!Module({ cache: cache, id: id }).isLoaded) {
        deferred = anonymous.pop()
        deferred.unshift(id)
        define.apply(null, deferred)
      }
    }

    /**
     * Implementation of CommonJS
     * [Modules/Transport/D](http://wiki.commonjs.org/wiki/Modules/Transport/D)
     * @param {Object} descriptors
     *    Hash of module top level module id's and relevant factories.
     *
     * @param {String[]} dependencies
     *    Top-level module identifiers corresponding to the shallow
     *    dependencies of the given module factory.
     * @param {Object} extra
     *    **Non-standard** helper utilities (improving debugging)
     */
    loader.define = function define(id, dependencies, factory) {
      var module;
      if (isString(id)) {
        if (!isArray(dependencies)) {
          factory = dependencies;
          dependencies = getDependencies(id, dependencies);
        }
        module = Module({ id: id, cache: cache, plugin: loader })
        module.factory = factory;
        module.dependencies = dependencies;
        module.compile();
      } else {
        // Shifting arguments since `uri` is missing.
        factory = dependencies;
        dependencies = id;
        
        if (isInteractiveMode) {
          // If it's an interactive mode we are able to detect module ID by
          // finding an interactive script's `data-id` attribute. We call
          // `define` once again, but this time with an explicit module `id`.
          define(getId(), dependencies, factory);
        } else {
          // If it's not an interactive mode we need to wait for an associated
          // script `load` event. We store `dependencies` and `factory` so that
          // we can access them later, from the event listener.
          anonymous.push([ dependencies, factory ]);
        }
      }
    }
    loader.require = loader.Require('')
  }
  Loader.prototype.Require = function Require(base) {
    var loader = this;
    /**
     * detect
     */
    var require = function require(id, success, failure) {
      var uri, name;
      // If we got this far, than module is not loaded yet, so we load it via
      // module loader plugin associated with the given `uri`.
      // We define both module `exports` and `meta` data in advance which will
      // be passed to the module context once it's executed. This way we can
      // use asynchronous `require` from the browser console without
      // a callback which is quite common during development.
      exports = {};
      name = getPluginName(id)
      id = resolve(id, base)
      // We get (may involve loading of associated module) plugin associated
      // with a required `uri`. `onLoader` success callback, will be called
      // with `uri` that has plugin name stripped off and `loader` plugin.
      loader.Plugin(name, function onPlugin(plugin) {
        uri = getPluginUri(id)
        // We override module in case it was already requested.
        module = Module({
          // Module `id` is original `uri` with plugin prefix and resolved uri
          // suffix. Required module exports are cached using this `id`.
          id: name ? name + '!' + uri : uri,
          // Required `uri` is resolved with to the `base` to get an absolute
          // `uri`.
          uri: plugin.normalize ? plugin.normalize(uri) : uri,
          plugin: plugin,
          exports: exports,
          cache: cache
        });
        module.load(success, failure)
        // Override exports in case module is already being loaded
        exports = module.meta.exports
      }, failure);
      return exports;
    };
    require.main = loader.main;
    return require;
  }
  /**
   * Returns plugin for the given module id.
   */
  Loader.prototype.Plugin = function Plugin(name, success, failure) {
    var plugins = this.plugins;
    if (!name || name === module.id)
      return success(this)
    // If we already cached plugin with this name then we return it.
    if (name in plugins)
      return success(plugins[name])
    // Finally if module for this plugin has not been required yet, we require
    // it and then create a loader out of it.
    this.require(name, function onRequire(plugin) {
      success(plugins[name] = plugin);
    }, failure);
  }
  Loader.prototype.normalize = function normalize(uri) {
    return uri.substr(-3) !== '.js' ? uri + '.js' : uri
  }
  Loader.prototype.link = function link(module) {
    var dependencies = module.dependencies, l = dependencies.length, ll = l

    function next() { if (--ll === 0) module.evaluate(module.factory) }
    function reject(error) { module.reject(error) }

    while (l--) this.require(dependencies[l], next, reject)
  }
  Loader.prototype.compile = function compile(module) {
    if (!module.dependencies.length) module.evaluate(module.factory)
    else this.link(module)
  }
  Loader.prototype.evaluate = function evaluate(module) {
    module.factory.call(NaN, this.Require(module.id), module.meta.exports, module.meta, undefined)
    module.resolve()
  }
  /**
   * Loads resource from the given `uri`. Once resource is loaded (in this
   * context it also means enclosed JS calls `define` and module `id` is
   * detected using some hackery) `success` callback is called. If loading
   * fails then `failure` callback is called instead.
   * @param {String} uri
   *    URI of the resource to be loaded.
   * @param {Function} success
   *    Callback that is called with `uri` and loaded `resource` from it.
   * @param {Function} failure
   *    Callback that is called with an `error` that occurred when loading
   *    `resource` form `uri`.
   */
  Loader.prototype.load = function load(module) {
    var element;
    // Using standard script injection technique in order to load resource
    // from the given `uri`.
    element = document.createElement('script');
    element.setAttribute('type', 'text/javascript');
    element.setAttribute('data-loader', 'teleport');
    element.setAttribute('data-id', module.id);
    element.setAttribute('src', module.uri);
    element.setAttribute('charset', 'utf-8');
    element.setAttribute('async', true);

    // If element has `addEventListener` then it's a modern browser and
    // "load" event will be called on script element after script is executed
    // we use listener for that event, in order to call `define` second time
    // with an explicit module `id` that is read form 'data-id' element.
    if (element.addEventListener)
      element.addEventListener('load', this.onInject, false);

    document.getElementsByTagName('head')[0].appendChild(element);
  }

  exports.Loader = Loader
  teleport = new Loader
  exports.define = teleport.define
  exports.require = teleport.require
  exports.cache = teleport.cache

define('loader', [], function(require, exports, module, undefined) {

})

})(null, this, { id: 'teleport' }, undefined);

define('text', [], function(require, exports, module, undefined) {
  exports.version = '0.1.0'
  exports.escape = function escape(content) {
    return content.replace(/(['\\])/g, '\\$1')
                  .replace(/[\f]/g, "\\f")
                  .replace(/[\b]/g, "\\b")
                  .replace(/[\n]/g, "\\n")
                  .replace(/[\t]/g, "\\t")
                  .replace(/[\r]/g, "\\r")
  }
  exports.load = function load(module) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', module.uri, true)
    xhr.onreadystatechange = function onProgress() {
      if (xhr.readyState === 4) {
        module.meta.exports = xhr.responseText
        module.resolve()
      }
    }
    xhr.send(null)
  }
})

define('http', [], function(require, exports, module, undefined) {
  exports.normalize = function normalize(uri) {
    return "http://" + uri
  }
})
