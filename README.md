
This example demonstrates loading a set of CommonJS with asynchronous
XMLHttpRequests.

The advantages of this approach include:

 * it can load static JavaScript files without server-side assistence
 * it does not block the JavaScript event loop on the client-side
 * some browsers will provide debug information because it uses "//@sourceURL"
   when constructing module factory functions with "eval".

The disadvantages include:

 * it does not make optimal use of the network.  Before the main module can be
   executed, every module must be loaded, which causes a number of round trips
   from the client to the server related to the depth of the dependency
   hierarchy for the modules being loaded.  The performance will degrade in
   terms of the round-trip-time and the number of round trips, a characteristic
   of "chatty" Internet protocols.
 * some browsers will have difficulty providing useful debug information
   because module factory functions are constructed with "eval".

One disadvantage of CommonJS modules is that there is no single way to load
those modules that will work optimally in every situation.  This disadvantage
can be offset by the availability of numerous compliant CommonJS loaders that
address each of the desirable combined goals of debugability, static file
hosting, compliation, server side support, bundling, and preloading.

 * debugability: support in some browsers
 * static file hosting: supported
 * compilation: not supported or necessary
 * server side: not supported or necessary
 * bundling: not supported
 * preloading: not supported

