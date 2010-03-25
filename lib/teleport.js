/*
 * An implementation of the CommonJS Modules 1.1
 * Copyright (c) 2009 by Irakli Gozalishvili
 */
var require = function pseoudoRequire(id) { // wiil be replaced by require.Sandbox
    return require.Sandbox({ global: window })(id);
};
require.main = function pseoudoMain(id) { // wiil be replaced by require.Sandbox
    return require.Sandbox({ global: window }).main(id);
}
require.Sandbox = function Sandbox(properties) {
    var join = Array.prototype.join.call;
    var slice = Array.prototype.slice.call;
    var REQUIRE_MATCH = /require\s*\(('|")([\w\W]*?)('|")\)/mg;
    var COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g;
    function Wrap(source, id, url) {
        return 'require.define({'
            + '"' + id + '":{ ' +
                'factory: function(require, exports, module, global) { ' +
                    source +
                '\n/**/}, ' +
                'get sourceId() { ' +
                    'delete this.sourceId; ' +
                    'try { ' +
                        'throw new Error(); ' +
                    '} catch(e) { ' +
                        'return this.sourceId = e.sourceId; ' +
                    '}' +
                '}' +
            '}' +
        '});\n//@ sourceURL=' + url;
    }
    var global = properties.global || {};
    var prefix = properties.prefix || "";
    var modules = properties.modules || {};
    var factories = properties.factories || {};
    var sources = properties.sources || {};
    var sourceIds = {};
    var callbacks = {};
    var stack = "", ident = "";
    // providing global print
    var print = properties.print || function print() {};
    var waiting = 0, metadata = {}, Main;
    // providing "console" module
    if (typeof console !== "undefined") modules.console = console;
    else factories.console = function console(require, exports, module, global) {
        var print = require("system").print;
        var IDENT = "", times = {}, counts = {};
        exports.log = function log() { print(IDENT + "LOG:" + join(arguments, " ")); return exports; }
        exports.debug = function debug() { print(IDENT + "DEBUG:" + join(arguments, " ")); return exports; }
        exports.info = function info() { print(IDENT + "INFO:" + join(arguments, " ")); return exports; }
        exports.warn = function warn() { print(IDENT + "WARN:" + join(arguments, " ")); return exports; }
        exports.error = function error() { print(IDENT + "ERROR:" + join(arguments, " ")); return exports; }
        exports.assert = function assert(expression) {
            if (expression) print(slice(arguments, 1).join(" "))
            else throw new Error("expression passed to console.assert was false");
            return exports;
        };
        exports.dir = exports.dirxml = function dir(object) {
            var message = object.toString() + " ->";
            for (var key in object) {
                message += "'\n\t" + key + " : ";
                try {
                    message += object[key]
                } catch(e) {
                    message += "[property access failed]"
                }
            }
            print(message);
            return exports;
        }
        exports.group = function group() {
            exports.log.apply(arguments)
            IDENT += "\t";
            return exports;
        }
        exports.groupEnd = function groupEnd() { IDENT = IDENT.substr(0, Math.max(IDENT.length - 1, 0)) }
        exports.time = function time(name) { times[name] = (new Date()).getTime(); return exports;}
        exports.timeEnd = function time(name) { print( "TIME:" + (name||"") + " " + (times[name] - (new Date()).getTime())); return exports; }
        exports.count = function count(title) { print("COUNT:" + (title||"") + " " + (counts[title] = (counts[title] || 0) + 1)); }
        exports.profile = exports.profileEnd = function() { print("profiling is not implemented") };
    };
    // providing "system" module factory
    factories.system = { factory: function system(require, exports, module, global) {
        var args = [];
        var env = {};
        var params = window.location.search.substr(1).split("&");
        for (var i = 0, l = params.length; i < l; i++) {
            var parts = params[i].split("=");
            var key = decodeURIComponent(parts[0]);
            if (key) {
                args.push(key);
                var value = parts[1];
                if (value) args.push(env[key] = decodeURIComponent(value));
            }
        }
        params = null;
        function stdio() {
            var buffer = [];
            return {
                write: function(text) {
                    buffer.push(text.toString());
                    return this;
                },
                flush: function() {
                    print(buffer.splice(0).join(""));
                    return this;
                }
            }
        }
        exports.stdin  = null; /* TODO */
        exports.stdout = stdio();
        exports.stderr = stdio();
        exports.args = args;
        exports.print = print;
        exports.env  = env;
    }};

    function sandbox(id, baseId) {
        id = resolve(id, baseId);
        ident += "  ";
        var line = ident + " + " + id;
        stack += "\n" + line;
        load(id, requirer);
        ident = ident.substr(2);
        return modules[id] || (modules[id] = {});
    }
    var requirer = function require(id) { return sandbox(id); };
    requirer.Sandbox = Sandbox;
    var main = requirer.main = function main(id) {
        if (properties.override) id = system.env.main || id;
        else id = id || system.env.main;
        if (!id) throw new Error("Main module is not specified");
        require.main = Main = metadata[id] || (metadata[id] = { id: id });
        if (waiting === 0) require.ensure([id], function() { sandbox(id) });
        return modules[id] = (modules[id] = {});
    };
    requirer.define = function define(deliveries) {
        for (var id in deliveries) {
            var factory = factories[id] = deliveries[id];
            factory = factory.factory;
            factory.name = factory.displayName = factory.id = id;
        }
    };
    requirer.ensure = function ensure(modules, callback) {
        preload(modules, callback);
    }
    // override pseoudoRequire if not done yet
    if (require.name != "require") require = requirer;

    function preload(modules, callback, baseId) {
        for (var i = 0, l = modules.length; i < l; i++) {
            var id = baseId ? resolve(modules[i], baseId) : modules[i];
            if (sources[id] !== undefined || factories[id] !== undefined) continue;
            waiting ++;
            sources[id] = null;
            fetch(id, null, function resolveDependency(source, id, url) {
                sources[id] = Wrap(source, id, url);
                var dependency, dependencies = depends(source);
                // fetching dependencies
                while ((dependency = dependencies.shift())) {
                    dependency = resolve(dependency, id);
                    // skipping existing
                    if (sources[dependency] !== undefined || factories[dependency] !== undefined) continue;
                    waiting ++;
                    sources[dependency] = null;
                    fetch(dependency, null, resolveDependency, function(failedId, failedUrl) {
                        var line = source.split(failedId)[0].split("\n").length;
                        throw exception(new Error("Cant find module [" + failedId + "](" + failedUrl + ")"), id, line);
                    });
                }
                // removing module from dependency and loading if was the last
                waiting--;
                if (waiting === 0 && callback !== undefined) callback();
            });
        }
    }
    function load(id, require, reload) {
        // checking of module is fetched || factored || or ready
        var source = sources[id], factory = factories[id], module = modules[id];
        if (factory || source || module) { // module is fetched
            try {
                try {
                    if (!factory && source) { // source is fetched but not factored
                        eval(sources[id]);
                    }
                } catch(e) {
                    throw exception(e, id)
                }
                if (factories[id] && (reload || !factory || (!source && !module))) {
                    // module factory is here but module is not created yet
                    var require = Require(id);
                    var exports = modules[id] || (modules[id] = {});
                    module = metadata[id] || (metadata[id] = { id: id });
                    factories[id].factory.call({}, require, exports, module, global);
                }
            } catch(e) {
                throw exception(e);
            }
        } else { // module needs to be fetched
            preload([id], function() { load(id, require) })
        }
    }
    function exception(e, id, line) {
        if (e) {
            if (e.isException) return e;
            e.isException = true;
            exception.prototype = e;
            return new exception(null, id, line);
        }
        // line
        line = this.lineno = this.line = this.lineNumber
            = this.lineno || this.line || this.lineNumber || line;
        // sourceURL
        uri = this.filename || this.fileName || this.sourceURL || path(id);
        if (!uri) {
            for (var key in factories) {
                if (factories[key].sourceId == this.sourceId) {
                    uri = path(id = key)
                    break;
                }
            }
        }
        this.filename = this.fileName = this.sourceURL = uri;
        var factory = sources[id] || (factories[id] ? factories[id].factory : null);
        // error details
        if (line && factory) {
            line --;
            var lines = factory.toString().split("\n");
            var errorLine = lines[line];
            var diff = lines.slice(0, line).join("\n").length;
            var begin = this.expressionBeginOffset - diff || 0;
            var length = this.expressionEndOffset - diff - begin || errorLine.length;
            this.message += "\n" + errorLine;
            var arrow = "\n";
            while (begin --) arrow += " "
            while (length --) arrow += "~"
            this.message += arrow;
        }
        // stack trace
        this.message += "\nStack trace: " + stack;
        return this;
    }

    function depends(source) {
        var source = source.replace(COMMENTS_MATCH, "");
        var dependency, dependencies = [];
        while(depenedency = REQUIRE_MATCH.exec(source)) dependencies.push(depenedency[2]);
        return dependencies;
    }
    function resolve(id, baseId) {
        if (0 < id.indexOf("://")) return id;
        var part, parts = id.split("/");
        var root = parts[0];
        if (root.charAt(0) != ".") return prefix + id;
        baseId = baseId || prefix;
        var base = baseId.split("/");
        base.pop();
        while (part = parts.shift()) {
            if (part == ".") continue;
            if (part == ".." && base.length) base.pop();
            else base.push(part);
        }
        return base.join("/");
    }
    function path(id) {
        if (!id) return;
        var url = id, packageId = id.split("/")[0];
        if (packageId in catalog) {
            var pack = catalog[packageId];
            url = pack.path
                + ((pack.directories && pack.directories.lib) ? pack.directories.lib : "lib")
                + "/" + packageId + id.substr(packageId.length);
        }
        return url + ".js";
    }
    function fetch(id, url, success, error) {
        url = url || path(id);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if((xhr.status == 200 || xhr.status == 0) && xhr.responseText != "") {
                    var source = xhr.responseText;
                    success(source, id, url)
                } else {
                    if (error) return error(id, url);
                    else throw new Error("Cant fetch module from: " + url);
                }
            }
        }
        xhr.send(null);
    }
    function Require(baseId) {
        var require = function require(id) {
            return sandbox(id, baseId);
        }
        require.ensure = function ensure(modules, callback) { preload(modules, callback, baseId) }
        require.define = requirer.define;
        require.main = Main;
        return require;
    }
    // overriding global require in case this is not sandboxed yet
    var system = require("system"), program = system.env.main;
    var catalog = properties.catalog || system.env.catalog;
    if (typeof catalog == "string") {
        waiting ++;
        fetch("packages", catalog, function(source, id, url) {
            sources[id] = Wrap("exports.catalog = " + source, id, url)
            catalog = requirer("packages").catalog;
            waiting --;
            if (Main) main(Main.id);
        });
    } else if (!properties.provides) {
        // providing "packages" module factory
        factories.packages = { factory: function packages(require, exports, module, global, print) {
            exports.catalog = catalog;
            for (var key in catalog) {
                var pack = catalog[key];
                if (!pack.name) pack.name = key;
                if (!pack.directories) pack.directories = { lib: "lib" };
            }
        }};
        catalog = requirer("packages").catalog;
    }
    return requirer;
};