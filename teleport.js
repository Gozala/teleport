/* vim:set ts=2 sw=2 sts=2 expandtab */
/*jshint asi: true undef: true es5: true node: true devel: true browser: true
         forin: true, eqnull: true latedef: false supernew: true */
/*global define: true */

// CommonJS AMD 1.1 loader.
(function(require, exports, module, undefined) {
  var isInteractiveMode, isArray, isString, baseURI, cache, anonymous, onInject,
      plugins, observers, LOADING, LOADED, BROKEN, SUCCESS, FAILURE, teleport,
      main,

      COMMENT_PATTERN = /(\/\*[\s\S]*?\*\/)|((^|\n)[^('|"|\n)]*\/\/[^\n]*)/g,
      REQUIRE_PATTERN = /require\s*\(['"]([\w\W]*?)['"]\s*\)/g


  // Both successfully loaded and failed modules are cached by the unique
  // identifier that is contains plugin `name` used to load and a resource
  // `uri` module was loaded from. So keys of this map have a form of
  // `text!http://foo.com/bar` for plugin loaded modules and
  // `!http://foo.com/bar.js` for normal modules.
  cache = exports.cache = {}
  // Arguments passed to the `define` by an anonymous modules (modules that do
  // not explicitly pass their id to the `define`). This arguments are used by
  // `onAttach` function listening to the script's 'load' event.
  anonymous = []
  // Map of cached plugins, which is just a map of plugin names mapped to the
  // associated modules.
  plugins = {}
  // module observers map linked with a module id.
  observers = {}
  main = null

  LOADING = []
  LOADED = []
  BROKEN = []

  SUCCESS = {}
  FAILURE = {}
  // IE (at least 6-8) do not dispatches `'load'` events on script elements
  // after execution, but `readyState` property value of such script elements
  // is `'interactive'`, which we default to in case `addEventListener` is
  // not defined.
  isInteractiveMode = !('addEventListener' in document)

  isString = function isString(value) { return 'string' === typeof value }
  isArray = Array.isArray || function isArray(value) {
    return '[object Array]' === Object.prototype.toString.call(value)
  }

   function getMainId() {
     var i, ii, main, elements = document.getElementsByTagName('script');
     for (i = 0, ii = elements.length; i < ii; i++)
       if ((main = elements[i].getAttribute('data-main'))) return main
   }

  function getId() {
    var script, scripts = document.getElementsByTagName('script'),
        l = scripts.length;

    while ((script = scripts[--l])) {
      if ('interactive' === script.readyState)
        return script.getAttribute('data-id')
    }
  }

  function isAbsolute(uri) { return ~uri.indexOf('://') }
  function isPlugin(uri) { return ~uri.indexOf('!') }

  baseURI = ''

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
  function isAbsolute(uri) { return uri && uri.charAt(0) !== '.' }
  function resolve(uri, base) {
    var path, paths, last
    if (isAbsolute(uri)) return uri
    paths = uri.split('/')
    base = base ? base.split('/') : [ '.' ]
    if (base.length > 1) base.pop()
    while ((path = paths.shift())) {
      if (path === '..') {
        if (base.length && base[base.length - 1] !== '..') {
          if (base.pop() === '.') base.push(path)
        } else base.push(path)
      } else if (path !== '.') {
        base.push(path)
      }
    }
    if (base[base.length - 1].substr(-1) === '.') base.push('')
    return base.join('/')
  }

  function normalize(plugin, name, id, base) {
    id = getPluginUri(id)
    id = plugin.normalize ? plugin.normalize(id) : id
    id = resolve(id, base)
    return name ? name + '!' + id : id
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
    var match, plugin, dependency, dependencies = [];
    // strip out comments to ignore commented `require` calls.
    source = String(source).replace(COMMENT_PATTERN, '')
    while ((match = REQUIRE_PATTERN.exec(source))) {
      dependency = match[1]

      if ((plugin = getPluginName(dependency)))
        dependency = plugin + "!" + resolve(getPluginUri(dependency), uri)
      else
        dependency = resolve(dependency, uri)

      if (!~dependencies.indexOf(dependency))
        dependencies.push(dependency)
    }
    return dependencies
  }

  function isLoaded(id, set) {
    return set ? LOADED.push(id) : ~LOADED.indexOf(id)
  }
  function isLoading(id, set) {
    return set ? LOADING.push(id) : ~LOADING.indexOf(id)
  }
  function isBroken(id, set) {
    return set ? BROKEN.push(id) : ~BROKEN.indexOf(id)
  }
  function observe(id, success, failure) {
    if (success)
      (SUCCESS[id] || (SUCCESS[id] = [])).push(success)
    if (failure)
      (FAILURE[id] || (FAILURE[id] = [])).push(failure)
  }
  function signal(id, result, success) {
    var observer, observers = (success ? SUCCESS : FAILURE)[id]
    ;delete SUCCESS[id]
    ;delete FAILURE[id]
    if (observers)
      while ((observer = observers.shift())) observer(result)
  }
  function failed(module, failure) {
    isBroken(module.id, true)
    signal(module.id, module.failure = failure, false)
  }
  function loaded(module) {
    isLoaded(module.id, true)
    signal(module.id, module, true)
  }

  function load(module, plugin, success, failure) {
    var id = module.id
    if (isLoaded(id)) return success && success(module)
    else if (isBroken(id)) return failure && failure(module.failure)
    else observe(id, success, failure)

    if (!isLoading(id)) {
      isLoading(id, true)
      ;(plugin.load || teleport.load)(module, loaded, failed)
    }
  }

  function loadAndRun(module, plugin, success, failure) {
    load(module, plugin, function() {
      evaluate(module)
      success && success(module.exports)
    }, failure)
  }
  function evaluate(module) {
    module.factory.call(module, Require(module.id), module.exports, module, undefined)
  }

  function compile(module) {
    var dependencies = module.dependencies, l = dependencies.length, ll = l

    function next() {
      if (--ll === 0) {
        loaded(module)
      }
    }

    while (l--) require(dependencies[l], next, failed)
  }

  function Module(options) {
    var module
    if (!options) return this
    if (!(module = cache[options.id])) {
      module = cache[options.id] = new Module
      module.exports = options.exports || {}
      module.id = options.id
      module.uri = getPluginUri(module.id)
    }
    return module
  }

  /**
   * Returns plugin for the given module id.
   */
  function Plugin(name, success, failure) {
    name = name || module.id
    // If we already cached plugin with this name then we return it.
    if (name in plugins)
      return success(plugins[name])
    // Finally if module for this plugin has not been required yet, we require
    // it and then create a loader out of it.
    require(name, function onRequire(plugin) {
      success(plugins[name] = plugin);
    }, failure);
  }

  onInject = function onInject(event) {
    var element, id, deferred
    element = event.currentTarget || event.srcElement
    element.removeEventListener('load', onInject, false)
    id = element.getAttribute('data-id')
    // Define deferred module only if it has not been defined yet. In some
    // cases modules with explicit id's can be used in mix with anonymous
    // modules and we should only handle anonymous ones.
    if (!isLoaded(id)) {
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
  function define(id, dependencies, factory) {
    var module, name, uri
    if (isString(id)) {
      if (!isArray(dependencies)) {
        factory = dependencies
        dependencies = getDependencies(id, dependencies)
      }
      name = getPluginName(id)
      Plugin(name, function onPlugin(plugin) {
        id = normalize(plugin, name, id, baseURI)
        // We override module in case it was already requested.
        module = Module({ id: id })
        module.factory = factory
        module.dependencies = dependencies
        if (!dependencies.length) {
          loaded(module)
        }
        else compile(module)
      })
    } else {
      // Shifting arguments since `uri` is missing.
      factory = dependencies
      dependencies = id

      if (isInteractiveMode) {
        // If it's an interactive mode we are able to detect module ID by
        // finding an interactive script's `data-id` attribute. We call
        // `define` once again, but this time with an explicit module `id`.
        define(getId(), dependencies, factory)
      } else {
        // If it's not an interactive mode we need to wait for an associated
        // script `load` event. We store `dependencies` and `factory` so that
        // we can access them later, from the event listener.
        anonymous.push([ dependencies, factory ])
      }
    }
  }

  function Require(base) {
    base = base || baseURI
    /**
     * detect
     */
    var require = function require(id, success, failure) {
      var module, name, exports;
      // If we got this far, than module is not loaded yet, so we load it via
      // module loader plugin associated with the given `uri`.
      // We define both module `exports` and `meta` data in advance which will
      // be passed to the module context once it's executed. This way we can
      // use asynchronous `require` from the browser console without
      // a callback which is quite common during development.
      exports = {};
      name = getPluginName(id)
      // We get (may involve loading of associated module) plugin associated
      // with a required `uri`. `onLoader` success callback, will be called
      // with `uri` that has plugin name stripped off and `loader` plugin.
      Plugin(name, function onPlugin(plugin) {
        id = normalize(plugin, name, id, base)
        // We override module in case it was already requested.
        module = Module({ id: id, exports: exports })
        // Override exports in case module is already being loaded
        exports = module.exports
        loadAndRun(module, plugin, success, failure)
      }, failure)
      return exports
    };
    require.main = main
    return require
  }

  module.id = resolve('teleport', baseURI);
  exports.define = define
  main = exports.main = function (id) {
    // TODO: Fix this hack in a saner way.
    main = Module({ id: normalize(teleport, '', id, baseURI), exports: {} })
    require(id)
  }
  exports.require = require = Require()
  teleport = plugins[module.id] = {
    version: '0.1.0',
    require: require,
    main: require.main,
    define: define,
    normalize: function normalize(uri) {
      return uri.substr(-3) !== '.js' ? uri + '.js' : uri
    },
    evaluate: function evaluate(module) {
      module.factory.call(NaN, Require(module.id), module.meta.exports, module.meta, undefined)
      module.resolve()
    },
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
    load: function load(module, success, failure) {
      var element;
      // Using standard script injection technique in order to load resource
      // from the given `uri`.
      element = document.createElement('script')
      element.setAttribute('type', 'text/javascript')
      element.setAttribute('data-loader', 'teleport')
      element.setAttribute('data-id', module.id)
      element.setAttribute('src', module.uri)
      element.setAttribute('charset', 'utf-8')
      element.setAttribute('async', true)

      // If element has `addEventListener` then it's a modern browser and
      // "load" event will be called on script element after script is executed
      // we use listener for that event, in order to call `define` second time
      // with an explicit module `id` that is read form 'data-id' element.
      if (element.addEventListener)
        element.addEventListener('load', onInject, false)

      document.getElementsByTagName('head')[0].appendChild(element)
    }
  }

  if ((main = getMainId())) teleport.main(main)
})(null, this, {}, undefined);

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
  exports.load = function load(module, callback) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', module.uri, true)
    xhr.onreadystatechange = function onProgress() {
      if (xhr.readyState === 4) {
        callback(module, xhr.responseText)
      }
    }
    xhr.send(null)
  }
})

define('http', [], function(require, exports, module, undefined) {
  exports.normalize = function normalize(uri) {
    uri = ~uri.indexOf("http://") ? uri : "http://" + uri
    uri = uri.substr(-3) === ".js" ? uri : uri + '.js'
    return uri
  }
})
define('https', [], function(require, exports, module, undefined) {
  exports.normalize = function normalize(uri) {
    uri = ~uri.indexOf("https://") ? uri : "https://" + uri
    uri = uri.substr(-3) === ".js" ? uri : uri + '.js'
    return uri
  }
})
