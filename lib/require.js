/*
 * An implementation of the CommonJS Modules 1.0
 * Copyright (c) 2009 by Irakli Gozalishvili
 */
var require = function require(id) { // wiil be replaced by require.Sandbox
    return require.Sandbox({ global: window })(id);
};
require.main = function main(id) { // wiil be replaced by require.Sandbox
    return require.Sandbox({ global: window }).main(id);
}
require.provide = function provide(id, factory) {
    return require.Sandbox({ global: window, provides: true }).provide(id, factory);
}
require.Sandbox = function Sandbox(properties) {
    var REQUIRE_MATCH = /require\s*\(('|")([\w\W]*?)('|")\)/mg;
    var COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g;
    var MODULE_PREFIX = "function(require, exports, module, global, print) { ";
    var MODULE_SUFFIX = "\n//*/\n}";
    var SOURCE_URL = "\n//@ sourceURL=";
    // hack for webkit to generate proper stack traces on exceptions
    var SOURCE_ID = '.__defineGetter__("sourceId",function(){try{throw new Error();}catch(e){return e.sourceId;}})';
    var register = properties.noEval ? scriptInject : sourceRegister;
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
    var waiting = [], metadata = {}, Main;
    // providing "system" module factory
    factories[prefix + "system"] = function(require, exports, module, global, print) {
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
    };

    function sandbox(id, baseId) {
        id = resolve(id, baseId);
        ident += "  ";
        var line = ident + " + " + id;
        stack += "\n" + line;
        load(id);
        ident = ident.substr(2);
        return modules[id] || (modules[id] = {});
    }
    var requirer = function require(id) {
        return sandbox(id);
    }
    requirer.main = function main(id) {
        if (properties.override) id = system.env.main || id;
        else id = id || system.env.main;
        if (!id) throw new Error("Main module is not specified");
        requirer.main = Main = metadata[id] = metadata[id] || { id: id };
        if (!waiting.length) requirer(id);
        return modules[id];
    };
    requirer.provide = function(id, factory) {
        if (typeof factory == "function") {
            factories[id] = factory;
            factory.displayName = id;
            var callback = callbacks[id];
            if (callback) callback(factory.toString(), id);
        } else {
            sourceRegister(id, id, factory);
        }
        return factory;
    };
    requirer.Sandbox = Sandbox;
    function load(id, reload) {
        // checking of module is fetched || factored || or ready
        var source = sources[id], factory = factories[id], module = modules[id];
        if (factory || source || module) { // module is fetched
            try {
                if (!factory && source) { // source is fetched but not factored
                    var factory = eval(sources[id]);
                    factory.name = factory.displayName = factory.id = id;
                }
                if (factory && (reload || !factories[id] || (!source && !module))) {
                    // module factory is here but module is not created yet
                    factories[id] = factory;
                    var require = Require(id);
                    var exports = modules[id] || (modules[id] = {});
                    module = metadata[id] || (metadata[id] = {});
                    module.id = id;
                    factory.call({}, require, exports, module, global, print);
                }
            } catch(e) {
                e = exception(e);
                system.stderr.write(e.sourceURL + "#" + e.line + "\n" + e.message + ":").flush();
                throw e;
            }
        } else { // module needs to be fetched
            waiting.push(id);
            fetch(id, function resolveDependency(source, requirer) {
                var dependency, dependencies = depends(source);
                // fetching dependencies
                while ((dependency = dependencies.shift())) {
                    dependency = resolve(dependency, requirer);
                    // skipping existing
                    if (sources[dependency] || factories[dependency] || modules[dependency] || waiting.indexOf(dependency) >= 0) continue;
                    waiting.push(dependency);
                    fetch(dependency, resolveDependency);
                }
                // removing module from dependency and loading if was the last
                waiting.splice(waiting.indexOf(requirer), 1);
                if (!waiting.length) load(id, true);
            })
        }
    }
    function exception(e) {
        if (e) {
            if (e.isException) return e;
            exception.prototype = e;
            e.isException = true;
            return new exception();
        }
        // line
        var line = this.lineno = this.line = this.lineNumber
            = this.lineno || this.line || this.lineNumber;
        // sourceURL
        var uri = this.filename || this.fileName || this.sourceURL;
        if (!uri) {
            for (var key in factories) {
                if (factories[key].sourceId == this.sourceId) {
                    uri = key;
                    break;
                }
            }
        }
        this.filename = this.fileName = this.sourceURL = uri;
        var factory = sources[uri];
        // error details
        if (line && uri && factory) {
            line --;
            var lines = factory.toString().split("\n");
            var diff = lines.slice(0, line).join("\n").length;
            var begin = this.expressionBeginOffset - diff;
            var length = this.expressionEndOffset - diff - begin;
            this.message += "\n" + lines[line];
            var arrow = "\n";
            while (-- begin) {
                arrow += " "
            }
            while (-- length) {
                arrow += "~"
            }
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
    function fetch(id, callback, url) {
        var path = url;
        if (!path) { // no url is specified
            var packageId = id.split("/")[0];
            path = id;
            if (packageId in catalog) {
                var pack = catalog[packageId];
                path = pack.path
                    + ((pack.directories && pack.directories.lib) ? pack.directories.lib : "lib")
                    + "/" + packageId + id.substr(packageId.length);
            }
            path += ".js";
        }
        var xhr = new XMLHttpRequest();
        xhr.open("GET", path, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4) {
                if((xhr.status == 200 || xhr.status == 0) && xhr.responseText != "") {
                    var source = xhr.responseText;
                    register(id, path, source, callback);
                } else {
                    var msg = "Cant fetch module from: " + path;
                    system.stderr.write(msg).flush();
                    throw new Error(msg);
                }
            }
        }
        xhr.send(null);
    }
    function sourceRegister(id, path, source, callback) {
        if (id == "packages") {
            source = "exports.catalog = " + source;
            path = id;
        }
        sources[id] = "var factory=" + MODULE_PREFIX
            + source + MODULE_SUFFIX
            + ";factory" + SOURCE_ID
            + ";factory;"
            + SOURCE_URL + path;
        if (callback) callback(source, id);
    }
    function scriptInject(id, path, source, callback) {
        if (id == "packages") {
            source = "exports.catalog = " + source;
            path = id;
        }
        callbacks[id] = callback;
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.id = id;
        script.textContent = 'require.provide("' + id +'", ' + MODULE_PREFIX
            + source + MODULE_SUFFIX + ")"
            + SOURCE_ID
            + SOURCE_URL + path;
        document.body.appendChild(script);
    }
    function scriptAppend(id, path, source, callback) {
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.setAttribute("src", path);
        document.body.appendChild(script);
    }
    function Require(baseId) {
        var require = function(id) {
            return sandbox(id, baseId);
        }
        require.main = Main;
        return require;
    }
    // overriding global require in case this is not sandboxed yet
    if (requirer.toString() != require.toString()) require = requirer;
    var system = requirer("system");
    var program = system.env.main;
    var catalog = properties.catalog || system.env.catalog;
    if (typeof catalog == "string") {
        waiting.push("packages");
        fetch("packages", function() {
            catalog = requirer("packages").catalog;
            waiting.splice(waiting.indexOf("packages"), 1);
            if (Main) requirer(Main.id);
        }, catalog);
    } else if (!properties.provides) {
        // providing "packages" module factory
        factories[prefix + "packages"] = function(require, exports, module, global, print) {
            exports.catalog = catalog;
            for (var key in catalog) {
                var pack = catalog[key];
                if (!pack.name) pack.name = key;
                if (!pack.directories) pack.directories = { lib: "lib" };
            }
        };
        catalog = requirer("packages").catalog;
    }
    return requirer;
};