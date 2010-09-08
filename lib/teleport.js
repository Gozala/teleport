/*
 * An implementation of the CommonJS Modules 1.1
 * Copyright (c) 2009 by Irakli Gozalishvili
 */
(function(global) {
    var require = global.require = function preRequire(id) { // wiil be replaced by require.Sandbox
        return require.Sandbox()(id);
    };
    require.main = function preMain(id) { // wiil be replaced by require.Sandbox
        return require.Sandbox().main(id);
    };
    require.ensure = function preEnsure(modules, callback, error) {
        return require.Sandbox().ensure(modules, callback, error);
    };
    /**
        Implementation of CommonJS [Modules/Transport/D](http://wiki.commonjs.org/wiki/Modules/Transport/D)
        @param {Object} descriptors         Hash of module top level module id's and relevant factories.
        @param {String[]} dependencies      top-level module identifiers corresponding to the shallow 
                                            dependencies of the given module factory
        @param {Object} extra               **Non-standard** helper utilities (improving debugging)
    */
    var define = require.define = function define(descriptors, dependencies, extra) {
        var factories = __factories__;
        var depends = __dependencies__;
        for (var id in descriptors) {
            factory = descriptors[id];
            factory.name = factory.displayName = factory.sourceURL = id;
            factories[id] = {
                sync: true,
                extra: extra,
                create: factory,
                source: null,
            };
        }
        if (null !== dependencies && undefined !== dependencies && 0 < dependencies.length) 
            depends.push.apply(depends, dependencies);
    };
    var __factories__ = {}, __dependencies__ = [];
    require.Sandbox = function Sandbox(properties) {
        properties = properties || {};
        var descriptors = {}, factories = __factories__, dependencies = __dependencies__, preRequire;
        var require = preRequire = function require(id) {
            var factory = factories[id];
            var descriptor = descriptors[id] || (descriptors[id] = { loaded: false, meta: { id: id }, module: {} });
            if (true !== descriptor.loaded) factory.create.call({}, require, descriptor.module, descriptor.meta, global);
            descriptor.loaded = true;
            return descriptor.module;
        };
        require.main = function main(id) {
            var system = require("system");
            if (properties.override) id = system.env.main || id;
            else id = id || system.env.main;
            // modifying require from prebootstrap period  
            if (undefined === id) throw new Error("Main module is not specified");
            dependencies.push(id);
            var descriptor = descriptors[id] = { module: {}, meta: { id: id} };
            require.ensure(dependencies, function() {
                require.main = preRequire.main = descriptor.meta;
                require(id);
            }, function(error) {
                console.error(error)
            });
            return descriptor.module;
        };
        require.define = define;
        require.Sandbox = Sandbox;

        if ("undefined" !== typeof console) descriptors.console = { loaded: true, module: console };
        var packages = require("teleport/packages");
        packages.descriptors = descriptors;
        packages.register(properties.catalog);
        require = require("teleport/loader").Require();
        if (global.require.name !== require.name) global.require = require;
        return require;
    };

    require.define(/* Implementation of CommonJS stdlib. */{
        /**
            Implementation of CommonJS [System/1.0](http://wiki.commonjs.org/wiki/System)
            @module
        */
        "system": function system(require, exports, module, global) {
            var ENGINE = require("teleport/engine");
            function Stream() {
                var buffer = [];
                var stream = {
                    write: function(text) {
                        buffer.push(text.toString());
                        return stream;
                    },
                    flush: function() {
                        print(buffer.splice(0).join(""));
                        return stream;
                    }
                };
                return stream;
            }
            var print = exports.print = ENGINE.print;
            exports.global = ENGINE.global;
            exports.engine = ENGINE.engine;
            exports.args = ENGINE.args;
            exports.env = ENGINE.env;
            exports.stdin  = null; /* #todo */
            exports.stdout = Stream();
            exports.stderr = Stream();
        },
        /**
            Implementation of CommonJS [console](http://wiki.commonjs.org/wiki/Console)
            @module
        */
        "console": function console(require, exports, module, global) {
            var slice = Array.prototype.slice;
            var map = Array.prototype.map;
            var SYSTEM = require("system"); stdout = SYSTEM.stdout;
            var IDENT = "", timeHash = {}, countHash = {};
            var FUNCTION_BODY = /^\s*|{[\s\S]*/g;

            function Dump(stream, prefix, suffix) {
                prfix = prefix || "";
                suffix = suffix || "";
                return function dump() {
                    var message = map.call(arguments, function(argument) {
                        if ("String" == typeof argument) return argument;
                        else return "\n" + represent(argument) + "\n";
                    }).join.call(arguments, " ");
                    stream.write(IDENT + prefix + message + suffix).flush();
                    return exports;
                }
            }
            var time = Dump(stdout, "TIME: "), group = Dump(stdout, "GROUP: "),
                count = Dump("COUNT: "), dump = Dump();

            exports.log = Dump(stdout, "LOG: ");
            exports.debug = Dump(stdout, "DEBUG: ");
            exports.info = Dump(stdout, "INFO: ");
            exports.warn = Dump(stdout, "WARN: ");
            exports.error = Dump(stdout, "ERROR: ");
            exports.assert = function consoleAssert(expression) {
                var message = slice.call(arguments, 1).join(" ");
                if (expression) dump(message);
                else throw new Error("Assertion failed: " + message);
                return exports;
            };
            exports.dir = exports.dirxml = function consoleDir(thing) {
                dump(represent(thing));
                return exports;
            }
            exports.group = function consoleGroup() {
                group.apply(null, arguments)
                IDENT += "\t";
                return exports;
            }
            exports.groupEnd = function groupEnd() {
                IDENT = IDENT.substr(0, Math.max(IDENT.length - 1, 0));
                return exports;
            }
            exports.time = function consoleTime(name) {
                timeHash[name] = (new Date()).getTime();
                return exports;
            }
            exports.timeEnd = function consoleTimeEnd(name) {
                return time(name || "", (new Date()).getTime() - timeHash[name]);
            }
            exports.count = function consoleCount(title) {
                return count(title || "", countHash[title] = ((countHash[title] || 0) + 1));
            }
            exports.profile = exports.profileEnd = function() {
                return dump("NYI")
            };
            function represent(thing, limit) {
                var result;
                switch(typeof thing) {
                    case "string":
                        result = '"' + thing + '"';
                        break;
                    case "number":
                        result = thing;
                        break;
                    case "object":
                        if (null === thing) return "null";
                        if (true === isArrayLike(thing)) return "[" + thing.join(",") + "]";
                        var names = [];
                        result = "{";
                        for (var name in thing) names.push(name);
                        if (names.length > 0) {
                            limit = undefined === limit ? names.length : limit;
                            result += names.slice(0, limit).map(function(name) {
                                var property = "\n  ";
                                try {
                                    var get, set;
                                    if (undefined !== thing.__lookupGetter__ && undefined !== (get = thing.__lookupGetter__(name))) {
                                        property += "get " + name + "() {...}";
                                    }
                                    if (undefined !== thing.__lookupSetter__ && undefined !== (set = thing.__lookupSetter__(name))) {
                                        property += (get ? ", " : "") + "set " + name + "() {...}";
                                    }
                                    if (undefined === get && undefined === set) {
                                        var property = thing[name];
                                        property += name + ": " + (typeof property == "object" ? "{...}" : represent(property));
                                    }
                                } catch(e) {
                                    property += "[Exception!]";
                                }
                                return property;
                            }).join(", ");
                            if (names.length > limit) result += ", ...";
                            result += "\n}";
                        }
                        break;
                    case "function":
                        result = thing.toString().replace(FUNCTION_BODY,"") + "{...}";
                        break;
                    case "undefined":
                        result = "undefined";
                        break;
                    default:
                        result = thing;
                }
                return result;
            }
            function isArrayLike(thing) {
                return (
                    undefined !== thing.length
                    && thing.toString.toString().indexOf("[native code]") > 0
                    && "[object Object]" !== thing.toString()
                );
            }
        },
        "packages": function packages(require, exports, module, global) {
            exports.catalog = {};
        },
        "narwhal/promise": function(require, exports, module, global) {
            // Tyler Close
            // Ported by Kris Kowal
            // Variation to illustrated ideas for improvements on the API.
            // * Deferred, Rejection, Reference instead of defer, reject, ref, and promise.
            // * Promise constructor that takes a descriptor and fallback.
            // * near has been changed to valueOf, and uses a valueOf operator instead
            //   an undefined operator, to reduce special cases.
            // * variadic arguments are used internally where applicable (POST arguments
            //   have not yet been altered.

            /*
             * Copyright 2007-2009 Tyler Close under the terms of the MIT X license found
             * at http://www.opensource.org/licenses/mit-license.html
             *
             * ref_send.js version: 2009-05-11
             */

            /*whatsupdoc*/

            // - the enclosure ensures that this module will function properly both as a
            // CommonJS module and as a script in the browser.  In CommonJS, this module
            // exports the "Q" API.  In the browser, this script creates a "Q" object in
            // global scope.
            // - the use of "undefined" on the enclosure is a micro-optmization for
            // compression systems, permitting every occurrence of the "undefined" keyword
            // bo be replaced with a single-character.
            (function (exports, undefined) {
            "use strict";

            // this provides an enqueue method in browsers, Narwhal, and NodeJS
            var enqueue;
            if (typeof setTimeout === "function") {
                enqueue = function (task) {
                    setTimeout(task, 0);
                };
            } else {
                enqueue = require("event-loop").enqueue;
            }

            /**
             * Performs a task in a future turn of the event loop.
             * @param {Function} task
             */
            exports.enqueue = enqueue;

            /**
             * Constructs a {promise, resolve} object.
             *
             * The resolver is a callback to invoke with a more resolved value for the
             * promise. To fulfill the promise, invoke the resolver with any value that is
             * not a function. To reject the promise, invoke the resolver with a Rejection
             * object. To put the promise in the same state as another promise, invoke the
             * resolver with that other promise.
             */
            exports.Deferred = Deferred;

            function Deferred() {
                // if "pending" is an "Array", that indicates that the promise has not yet
                // been resolved.  If it is "undefined", it has been resolved.  Each
                // element of the pending array is itself an array of complete arguments to
                // forward to the resolved promise.  We coerce the resolution value to a
                // promise using the Reference Promise because it handles both fully
                // resolved values and other promises gracefully.
                var pending = [], value;

                var promise = Object.create(Promise.prototype);
                promise.emit = function () {
                    var args = Array.prototype.slice.call(arguments);
                    if (pending) {
                        pending.push(args);
                    } else {
                        forward.apply(undefined, [value].concat(args));
                    }
                };

                var resolve = function (resolvedValue) {
                    var i, ii, task;
                    if (!pending)
                        return;
                    value = Reference(resolvedValue);
                    for (i = 0, ii = pending.length; i < ii; ++i) {
                        forward.apply(undefined, [value].concat(pending[i]));
                    }
                    pending = undefined;
                };

                return {
                    "promise": promise,
                    "resolve": resolve,
                    "reject": function (reason) {
                        resolve(Rejection(reason));
                    }
                };
            }

            /**
             * Constructs a Promise with a promise descriptor object and optional fallback
             * function.  The descriptor contains methods like when(rejected), get(name),
             * put(name, value), post(name, args), delete(name), and valueOf(), which all
             * return either a value, a promise for a value, or a rejection.  The fallback
             * accepts the operation name, a resolver, and any further arguments that would
             * have been forwarded to the appropriate method above had a method been
             * provided with the proper name.  The API makes no guarantees about the nature
             * of the returned object, apart from that it is usable whereever promises are
             * bought and sold.
             */
            exports.Promise = Promise;

            function Promise(descriptor, fallback) {

                if (fallback === undefined) {
                    fallback = function (op) {
                        return Rejection("Promise does not support operation: " + op);
                    };
                }

                var promise = Object.create(Promise.prototype);

                promise.emit = function (op, resolved /* ...args */) {
                    var args = Array.prototype.slice.call(arguments, 2);
                    var result;
                    if (descriptor[op])
                        result = descriptor[op].apply(descriptor, args);
                    else
                        result = fallback.apply(descriptor, arguments);
                    if (resolved)
                        return resolved(result);
                    return result;
                };

                return promise;
            };

            Promise.prototype.toSource = function () {
                return this.toString();
            };

            Promise.prototype.toString = function () {
                return '[object Promise]';
            };

            Promise.prototype.valueOf = function () {
                return this.emit("valueOf");
            };

            /**
             * @returns whether the given object is a promise.
             * Otherwise it is a resolved value.
             */
            exports.isPromise = isPromise;
            function isPromise(object) {
                return object instanceof Promise;
            };

            /**
             * Constructs a rejected promise.
             * @param reason value describing the failure
             */
            exports.Rejection = Rejection;

            function Rejection(reason) {
                return Promise({
                    "when": function (rejected) {
                        return rejected ? rejected(reason) : Rejection(reason);
                    }
                }, function fallback(op, resolved) {
                    var rejection = Rejection(reason);
                    return resolved ? resolved(rejection) : rejection;
                });
            }

            /**
             * Constructs a promise for an immediate reference.
             * @param value immediate reference
             */
            exports.Reference = Reference;

            function Reference(object) {
                // If the object is already a Promise, return it directly.  This enables
                // the Reference function to both be used to created references from
                // objects, but to tolerably coerce non-promises to References if they are
                // not already Promises.
                if (isPromise(object))
                    return object;
                return Promise({
                    "when": function (rejected) {
                        return object;
                    },
                    "get": function (name) {
                        return object[name];
                    },
                    "put": function (name, value) {
                        object[name] = value;
                    },
                    "delete": function (name) {
                        delete object[name];
                    },
                    "post": function (name, args) {
                        return object[name].apply(object, args);
                    },
                    "valueOf": function () {
                        return object;
                    }
                });
            }

            /**
             * Constructs a promise method that can be used to safely observe resolution of
             * a promise for an arbitrarily named method like "propfind" in a future turn.
             *
             * "Method" constructs methods like "get(promise, name)" and "put(promise)".
             */
            exports.Method = Method;
            function Method (methodName) {
                return function (object) {
                    var deferred = Deferred();
                    var args = Array.prototype.slice.call(arguments, 1);
                    forward.apply(undefined, [
                        Reference(object),
                        methodName,
                        deferred.resolve
                    ].concat(args));
                    return deferred.promise;
                };
            }

            /**
             * Registers an observer on a promise.
             *
             * Guarantees:
             *
             * 1. that resolved and rejected will be called only once.
             * 2. that either the resolved callback or the rejected callback will be
             *    called, but not both.
             * 3. that resolved and rejected will not be called in this turn.
             *
             * @param value     promise or immediate reference to observe
             * @param resolve function to be called with the resolved value
             * @param rejected  function to be called with the rejection reason
             * @return promise for the return value from the invoked callback
             */
            exports.when = function (value, resolved, rejected) {
                var deferred = Deferred();
                var done = false;   // ensure the untrusted promise makes at most a
                                    // single call to one of the callbacks
                forward(Reference(value), "when", function (value) {
                    if (done)
                        return;
                    done = true;
                    deferred.resolve(Reference(value).emit("when", resolved, rejected));
                }, function (reason) {
                    if (done)
                        return;
                    done = true;
                    deferred.resolve(rejected ? rejected(reason) : Rejection(reason));
                });
                return deferred.promise;
            };

            /**
             */
            exports.asap = function (value, resolved, rejected) {
                var deferred = Deferred();
                var done = false;   // ensure the untrusted promise makes at most a
                                    // single call to one of the callbacks
                Reference(value).emit("when", function (value) {
                    if (done)
                        return;
                    done = true;
                    deferred.resolve(Reference(value).emit("when", resolved, rejected));
                }, function (reason) {
                    if (done)
                        return;
                    done = true;
                    deferred.resolve(rejected ? rejected(reason) : Rejection(reason));
                });
                return deferred.promise;
            };

            /**
             * Gets the value of a property in a future turn.
             * @param object    promise or immediate reference for target object
             * @param name      name of property to get
             * @return promise for the property value
             */
            exports.get = Method("get");

            /**
             * Sets the value of a property in a future turn.
             * @param object    promise or immediate reference for object object
             * @param name      name of property to set
             * @param value     new value of property
             * @return promise for the return value
             */
            exports.put = Method("put");

            /**
             * Deletes a property in a future turn.
             * @param object    promise or immediate reference for target object
             * @param name      name of property to delete
             * @return promise for the return value
             */
            exports.del = Method("del");

            /**
             * Invokes a method in a future turn.
             * @param object    promise or immediate reference for target object
             * @param name      name of method to invoke
             * @param argv      array of invocation arguments
             * @return promise for the return value
             */
            exports.post = Method("post");

            /**
             * Guarantees that the give promise resolves to a defined, non-null value.
             */
            exports.defined = function (value) {
                return exports.when(value, function (value) {
                    if (value === undefined || value === null)
                        return Rejection("Resolved undefined value: " + value);
                    return value;
                });
            };

            /*
             * Enqueues a promise operation for a future turn.
             */
            function forward(promise /*, op, resolved, ... */) {
                var args = Array.prototype.slice.call(arguments, 1);
                enqueue(function () {
                    promise.emit.apply(promise, args);
                });
            }

            // Complete the closure: use either CommonJS exports or browser global Q object
            // for the exports internally.
            })(
                typeof exports !== "undefined" ?
                exports :
                Q = {}
            );
        },
        "teleport/ecmascript5": function(require, exports, module, global) {
            if (!Function.prototype.bind) {
                Function.prototype.bind = function (that) { // .length is 1
                    // 1. Let Target be the this value.
                    var target = this;
                    // 2. If IsCallable(Target) is false, throw a TypeError exception.
                    // XXX this gets pretty close, for all intents and purposes, letting
                    // some duck-types slide
                    if (typeof target.apply != "function" || typeof target.call != "function")
                        return new TypeError();
                    // 3. Let A be a new (possibly empty) internal list of all of the
                    //   argument values provided after thisArg (arg1, arg2 etc), in order.
                    var args = Array.prototype.slice.call(arguments);
                    // 4. Let F be a new native ECMAScript object.
                    // 9. Set the [[Prototype]] internal property of F to the standard
                    //   built-in Function prototype object as specified in 15.3.3.1.
                    // 10. Set the [[Call]] internal property of F as described in
                    //   15.3.4.5.1.
                    // 11. Set the [[Construct]] internal property of F as described in
                    //   15.3.4.5.2.
                    // 12. Set the [[HasInstance]] internal property of F as described in
                    //   15.3.4.5.3.
                    // 13. The [[Scope]] internal property of F is unused and need not
                    //   exist.
                    var bound = function () {

                        if (this instanceof bound) {
                            // 15.3.4.5.2 [[Construct]]
                            // When the [[Construct]] internal method of a function object,
                            // F that was created using the bind function is called with a
                            // list of arguments ExtraArgs the following steps are taken:
                            // 1. Let target be the value of F's [[TargetFunction]]
                            //   internal property.
                            // 2. If target has no [[Construct]] internal method, a
                            //   TypeError exception is thrown.
                            // 3. Let boundArgs be the value of F's [[BoundArgs]] internal
                            //   property.
                            // 4. Let args be a new list containing the same values as the
                            //   list boundArgs in the same order followed by the same
                            //   values as the list ExtraArgs in the same order.

                            var self = Object.create(target.prototype);
                            target.apply(self, args.concat(Array.prototype.slice.call(arguments)));
                            return self;

                        } else {
                            // 15.3.4.5.1 [[Call]]
                            // When the [[Call]] internal method of a function object, F,
                            // which was created using the bind function is called with a
                            // this value and a list of arguments ExtraArgs the following
                            // steps are taken:
                            // 1. Let boundArgs be the value of F's [[BoundArgs]] internal
                            //   property.
                            // 2. Let boundThis be the value of F's [[BoundThis]] internal
                            //   property.
                            // 3. Let target be the value of F's [[TargetFunction]] internal
                            //   property.
                            // 4. Let args be a new list containing the same values as the list
                            //   boundArgs in the same order followed by the same values as
                            //   the list ExtraArgs in the same order. 5.  Return the
                            //   result of calling the [[Call]] internal method of target
                            //   providing boundThis as the this value and providing args
                            //   as the arguments.

                            // equiv: target.call(this, ...boundArgs, ...args)
                            return target.call.apply(
                                target,
                                args.concat(Array.prototype.slice.call(arguments))
                            );

                        }

                    };
                    // 5. Set the [[TargetFunction]] internal property of F to Target.
                    // extra:
                    bound.bound = target;
                    // 6. Set the [[BoundThis]] internal property of F to the value of
                    // thisArg.
                    // extra:
                    bound.boundTo = that;
                    // 7. Set the [[BoundArgs]] internal property of F to A.
                    // extra:
                    bound.boundArgs = args;
                    bound.length = (
                        // 14. If the [[Class]] internal property of Target is "Function", then
                        typeof target == "function" ?
                        // a. Let L be the length property of Target minus the length of A.
                        // b. Set the length own property of F to either 0 or L, whichever is larger.
                        Math.max(target.length - args.length, 0) :
                        // 15. Else set the length own property of F to 0.
                        0
                    )
                    // 16. The length own property of F is given attributes as specified in
                    //   15.3.5.1.
                    // TODO
                    // 17. Set the [[Extensible]] internal property of F to true.
                    // TODO
                    // 18. Call the [[DefineOwnProperty]] internal method of F with
                    //   arguments "caller", PropertyDescriptor {[[Value]]: null,
                    //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
                    //   false}, and false.
                    // TODO
                    // 19. Call the [[DefineOwnProperty]] internal method of F with
                    //   arguments "arguments", PropertyDescriptor {[[Value]]: null,
                    //   [[Writable]]: false, [[Enumerable]]: false, [[Configurable]]:
                    //   false}, and false.
                    // TODO
                    // NOTE Function objects created using Function.prototype.bind do not
                    // have a prototype property.
                    // XXX can't delete it in pure-js.
                    return bound;
                };
            }

            // ES5 15.2.3.2
            if (!Object.getPrototypeOf) {
                Object.getPrototypeOf = function (object) {
                    return object.__proto__;
                    // or undefined if not available in this engine
                };
            }

            // ES5 15.2.3.3
            if (!Object.getOwnPropertyDescriptor) {
                Object.getOwnPropertyDescriptor = function (object) {
                    return {}; // XXX
                };
            }

            // ES5 15.2.3.4
            if (!Object.getOwnPropertyNames) {
                Object.getOwnPropertyNames = function (object) {
                    return Object.keys(object);
                };
            }

            // ES5 15.2.3.5
            if (!Object.create) {
                Object.create = function(prototype, properties) {
                    if (typeof prototype != "object" || prototype === null)
                        throw new TypeError("typeof prototype["+(typeof prototype)+"] != 'object'");
                    function Type() {};
                    Type.prototype = prototype;
                    var object = new Type();
                    if (typeof properties !== "undefined")
                        Object.defineProperties(object, properties);
                    return object;
                };
            }

            // ES5 15.2.3.6
            if (!Object.defineProperty) {
                Object.defineProperty = function(object, property, descriptor) {
                    var has = Object.prototype.hasOwnProperty;
                    if (typeof descriptor == "object" && object.__defineGetter__) {
                        if (has.call(descriptor, "value")) {
                            if (!object.__lookupGetter__(property) && !object.__lookupSetter__(property))
                                // data property defined and no pre-existing accessors
                                object[property] = descriptor.value;
                            if (has.call(descriptor, "get") || has.call(descriptor, "set"))
                                // descriptor has a value property but accessor already exists
                                throw new TypeError("Object doesn't support this action");
                        }
                        // fail silently if "writable", "enumerable", or "configurable"
                        // are requested but not supported
                        /*
                        // alternate approach:
                        if ( // can't implement these features; allow false but not true
                            !(has.call(descriptor, "writable") ? descriptor.writable : true) ||
                            !(has.call(descriptor, "enumerable") ? descriptor.enumerable : true) ||
                            !(has.call(descriptor, "configurable") ? descriptor.configurable : true)
                        )
                            throw new RangeError(
                                "This implementation of Object.defineProperty does not " +
                                "support configurable, enumerable, or writable."
                            );
                        */
                        else if (typeof descriptor.get == "function")
                            object.__defineGetter__(property, descriptor.get);
                        if (typeof descriptor.set == "function")
                            object.__defineSetter__(property, descriptor.set);
                    }
                    return object;
                };
            }

            // ES5 15.2.3.7
            if (!Object.defineProperties) {
                Object.defineProperties = function(object, properties) {
                    for (var property in properties) {
                        if (Object.prototype.hasOwnProperty.call(properties, property))
                            Object.defineProperty(object, property, properties[property]);
                    }
                    return object;
                };
            }

            if (!String.prototype.trim) {
                String.prototype.trim = function trim() {
                    return this.replace(/^\s*|\s*$/g, "");
                }
            }
        },
        "teleport/packages": function(require, exports, module, global) {
            var catalog = exports.catalog = require("packages").catalog;
            exports.descriptors = null;
            exports.register = function register(descriptors) {
                for (var name in descriptors) {
                    var descriptor = catalog[name] = descriptors[name];
                    if (undefined === descriptor.name) descriptor.name = name;
                    if (undefined === descriptor.directories) descriptor.directories = { lib: "lib" };
                }
            };
        },
        "teleport/loader": function (require, exports, module, global) {
            require('teleport/ecmascript5');
            var PACKAGES = require("teleport/packages"), catalog = PACKAGES.catalog,
                register = PACKAGES.register, descriptors = PACKAGES.descriptors;
            var Q = require("narwhal/promise"), when = Q.when,
                Deferred = Q.Deferred, Rejection = Q.Rejection;
            var factories = __factories__;
            var stack = "", ident = "";
            var REQUIRE_MATCH = /(^|[^\w\_])require\s*\(('|")([\w\W]*?)('|")\)/g;
            /**
                Reqular expression for stripping out comments from a module source.
                @type {RegExp} 
            */
            var COMMENTS_MATCH = /(\/\*([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)|((^|\n)[^\'\"\n]*\/\/[^\n]*)/g;
            
            function Wrap(source, id, url) {
                return 'require.define({' +
                    '"' + id + '": function(require, exports, module, global) { ' +
                        source +
                        '\n/**/}' +
                    "}," +
                    'null,' +
                    '{ ' +
                        'get sourceId() { ' +
                            'delete this.sourceId; ' +
                            'try { ' +
                                'throw new Error(); ' +
                            '} catch(e) { ' +
                                'return this.sourceId = e.sourceId; ' +
                            '}' +
                        '}' +
                    '});\n//@ sourceURL=' + url;
            }
            
            var define = require.define;
            function ensure(identifiers, callback, error) {
                when(Descriptors(identifiers, null, descriptors), function() {
                    callback(Require())
                }, error);
            }

            function all(promises) {
                var result = Deferred(), values = [], l = promises.length;
                promises.forEach(function(promise, index) {
                    when(promise, function(value) {
                        values[index] = value;
                        if (0 === --l) result.resolve(values);
                    }, function(reason) {
                        result.reject(reason);
                    });
                });
                return result.promise;
            }
            function Descriptors(identifiers, baseId, descriptors) {
                return all(identifiers.map(function(id) { 
                    return Descriptor(id, baseId, descriptors);
                }));
            }
            function Descriptor(id, baseId, descriptors) {
                id = resolve(id, baseId);
                var descriptor = descriptors[id];
                var factory = factories[id] || (factories[id] = { sync: false, extra: null });
                if (undefined !== factory && true === factory.sync) return id;
                var result = Deferred();
                var url = path(id);
                descriptor = descriptors[id] || (descriptors[id] = { id: id, module: {}, meta: { id: id } })
                descriptor.meta.url = url;
                var request = new XMLHttpRequest();
                request.open("GET", url, true);
                request.onreadystatechange = function onreadystatechange() {
                    if (request.readyState == 4) {
                        if ((request.status == 200 || request.status == 0) && request.responseText != "") {
                            var source = request.responseText;
                            var dependencies = descriptor.dependencies = depends(source);
                            factory.source = Wrap(source, id, url);
                            factory.sync = true;
                            result.resolve(0 === dependencies.length ? id : all([Descriptors(dependencies, id, descriptors), id]));
                        } else {
                            result.reject(descriptor);
                        }
                    }
                };
                request.send(null);
                return result.promise;
            }
            var Require = exports.Require = function Require(baseId) {
                var requirer = function require(id) {
                    return sandbox(id, baseId);
                }
                /**
                    Implementation of CommonJS 
                    [Modules/Async/A](http://wiki.commonjs.org/wiki/Modules/Async/A)
                    Makes passed modules, and their shallow and deep dependencies 
                    available for synchronous require and calles `callback` function
                    passing `require` function as its first argument.
                    @param {String[]} identifiers       module identifiers
                    @param {Function} callback          callback function
                */
                requirer.ensure = ensure;
                requirer.define = require.define;
                requirer.main = require.main;
                requirer.Sandbox = require.Sandbox;
                return requirer;
            };
            
            function sandbox(id, baseId) {
                id = resolve(id, baseId);
                stack += "\n" + (ident = ident + "  ") + " + " + id;
                load(id);
                ident = ident.substr(2);
                return descriptors[id].module;
            }
             
            var load = exports.load = function load(id) {
                // checking of module is fetched || factored || or ready
                var descriptor = descriptors[id] || (descriptors[id] = { loaded: false, meta: { id: id }, module: {} }),
                    factory = factories[id] || (factories[id] = { sync: false, extra: null });
                if (undefined === factory || true !== factory.sync) {
                    ensure([id], function() { load(id) }, function(error) { console.log(error) });
                } else { // module is fetched
                    var constructor = factory.create, source = factory.source;
                    try {
                        try {
                            if (undefined === constructor && undefined !== source) {
                                // source is fetched but not factored
                                eval(source);
                                factory = factories[id];
                                var constructor = factory.create, source = factory.source;
                            }
                        } catch(e) {
                            throw exception(e, id)
                        }
                        if (undefined !== constructor && true !== descriptor.loaded) {
                            // module factory is here but module is not created yet
                            constructor.call({}, Require(id), descriptor.module, descriptor.meta, global);
                            descriptor.loaded = true;
                        }
                    } catch(e) {
                        throw exception(e);
                    }
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
                        var factory = factories[key];
                        if (undefined !== factory.extra && factory.extra.sourceId == this.sourceId) {
                            uri = path(id = key)
                            break;
                        }
                    }
                }
                this.filename = this.fileName = this.sourceURL = uri;
                var factory = factories[id];
                // error details
                if (undefined !== line && undefined !== factory) {
                    line --;
                    var lines = (factory.source || factory.create).toString().split("\n");
                    var errorLine = lines[line] || '';
                    var diff = lines.slice(0, line).join("\n").length;
                    var begin = this.expressionBeginOffset - diff || 0;
                    diff -= begin
                    var length = this.expressionEndOffset - diff || errorLine.length;
                    this.message += "\n" + errorLine;
                    var arrow = "\n";
                    while (begin --) arrow += " ";
                    while (length --) arrow += "~";
                    this.message += arrow;
                }
                // stack trace
                this.message += ("\nStack trace: " + stack);
                return this;
            }
            function depends(source) {
                var source = source.replace(COMMENTS_MATCH, "");
                var dependency, dependencies = [];
                while(dependency = REQUIRE_MATCH.exec(source)) dependencies.push(dependency[3]);
                return dependencies;
            }
            function resolve(id, baseId) {
                if (0 < id.indexOf("://")) return id;
                var part, parts = id.split("/");
                var root = parts[0];
                if (root.charAt(0) != ".") return id;
                baseId = baseId || "";
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
                var url = id, name = id.split("/")[0];
                if (name in catalog) {
                    var descriptor = catalog[name];
                    url = descriptor.path
                        + ((descriptor.directories && descriptor.directories.lib) 
                            ? descriptor.directories.lib : "lib")
                        + "/" + name + id.substr(name.length);
                }
                return url + ".js";
            }
        }
    });
})(this);

require.define({
    "teleport/engine": function(require, exports, module, global) {
        var F = exports.F =  function() {};
        exports.global = global || (global = window);
        exports.engine = "browser";
        exports.print = ("undefined" === typeof console) ?  F : function($) { console.log($) };
        var args = exports.args = [];
        var env = exports.env = {};
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
    }
})
