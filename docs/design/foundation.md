Transquire: Package mapping
===========================

This high-level design document outlines how [Transquire] builds a [CommonJS] system in a browser. Design goal is to bring [CommonJS] system but preserve simplicity of current web development model, with zero tooling setup for development. Design relays on URI's to uniquely identify any module or package and provides bidirectional URI to ID translation scheme that allows deterministic delivery requirements of package modules regardless of a platform and a package manager. Design also solves modules id conflicts by namespacing them under package name / ID while leaving platform specific overlays possible through custom URI schemes. Intention of this document is to answer fundamental questions:


What is package
---------------
> 
[CommonJS packages](package) are distributed [CommonJS] programs / libraries. It is a cohesive wrapping of a collection of modules, code and other assets into a single form. It provides the basis for convenient delivery of CommonJS components. In order to avoid complexity this document suggests to think of package being an valid [URI] under which package content can found.  
*Examples:*

* Package under http *(likely most common scenario)*  
[http://github.com/Gozala/taskhub/](http://github.com/Gozala/taskhub/raw/gh-pages/)  
according to the [package specs](package) descriptor should be under  
[http://github.com/Gozala/taskhub/package.josn](http://github.com/Gozala/taskhub/raw/gh-pages/package.json)
 
* Package under chrome uri *(delivered by firefox extension)*  
[chrome://mypackage/content/](chrome://mypackage/content/)  
according to the [package specs](package) descriptor should be under  
[chrome://mypackage/content/package.json](chrome://mypackage/content/package.json)

* Package under local file system *(offline enviroments)*     
[file:///usr/lib/mymodule/](file:///usr/lib/mymodule/)  
according to the [package specs](package) descriptor should be under  
[file:///usr/lib/mymodule/package.json](file:///usr/lib/mymodule/package.json)


How are package ID's derived  
----------------------------

> 
According to the existing CommonJS [package] specs each package has a name. Which is effectively can be used as it's ID. There is no guarantee it will be unique, but most likely community will avoid same named packages and platform providers will make sure to have unique name per package in it's catalog. Probably [CommonJS] will get some sort of package registry helping developers in avoiding package name conflicts.


How are dependencies declared
-----------------------------
> 
Existing CommonJS [package] specification describes way of declaring dependencies. Where to retrieve package from is a separate concern. Program should provide all the necessary pointers to a platform it's using. It is important to note that non program packages delegate responsibility of providing pointers to a program that is going to use them. In an example of [Transquire] *(and hopefully this will find it's way to CommonJS)* pointers are described in `catalog.json` in a program package.  
Each key in the `catalog.json` represents a name / ID of the package it depends on. Corresponding value is a "pointer" hash with must have **`uri`** field with value of a unique package [URI] *(described in a first section of this document)*. It is expected that package managers will generate `catalog.json` files where "pointer"'s will be a corresponding package descriptors with additional **`uri`** field. In order to support design goal of zero tolling, [Transquire] only expects to find **`uri`** + other field that happens to contains a non standard values.  
*Example*:
<pre class="console">
{
    "taskhub": { 
        "uri": "http://gozala.github.com/taskhub/",
    },
    "github": { 
        "uri": "http://gozala.github.com/github/",
        "directories": {
            "lib": "somethingElse"
        }        
    }
}
</pre>
How are package modules required
--------------------------------
> 
As mention in first section package is just an [URI] and there for all the contained modules do translate to a sub [URI]'s. This paradigm provides enough space for creating interoperable reusable modules that can be used in any environment, regardless of package manager. Just like in browser any script can be injected to a page by its unique URI, so any module can be required by it's own unique URI regardless of which package it happened to be contained: 
<pre class="console">  
require("<a href="http://github.com/Gozala/taskhub/blob/gh-pages/lib/taskhub/main.js">http://github.com/Gozala/taskhub/lib/main.js</a>");
</pre>

> There are obvious issues with this use case:  
>
* long module identifiers
* change of module hosting in some cases may invalidates third party codebase.

> To address this exact issues issues program packages are mandated to provide a pointers to it's (nested) dependency packages. Having that in place example above can be easily translated to something that is expected to be used instead: 
<pre class="console">  
require("<a href="http://github.com/Gozala/taskhub/blob/gh-pages/lib/taskhub/main.js">taskhub/main</a>");
</pre>
Please notice that this is fully spec compatible with specs use of require. Details of URI to id translation are described below:
> 
1. **`"http://github.com/Gozala/taskhub/" ~ "taskhub"`**  
Package URI translates to a corresponding package name. In an example of **`catalog.json`** from previous section **`taskhub`** package points to a **`http://github.com/Gozala/taskhub/`** uri.
2. **`"lib/" ~ ""`**  
Directory containing module translates to an empty string. According to the CommonJS [package] descriptor specs default lib directory is **`lib/`**.
3. **`main.js ~ main`**  
Module path within the package lib remains same just a `.js` extension is being stripped out as required according in specs.   
> 
Obviously translation back is also possible by following the logic:
>
1. **`"taskhub" ~ "http://github.com/Gozala/taskhub/"`**  
Since module id is not top level and is not uri. **`"taskhub"`** package should be in catalog. In our example **`"taskhub"`** package points to a **`http://github.com/Gozala/taskhub/`**
2. **`"" ~ "lib/"`**  
Package uri should be followed by a directory name containing modules, which is defined in package descriptor *(& may be copied to a catalog for simpler lookups)* or might default to **`"lib/"`** like in our exmaple.
3. **`main ~ main.js`**  
Module path within the package lib remains same just expect a file extension **`".js"`** which is appended.   
> 
**Please note**: Some platforms may depend on a query params, for that case scenarios URI's to a modules are resolved according to an example below:

<pre class="console">
// package "mypackage"
require("http://module.loader.com/?get=mypackage")
// module "foo/bar" from "mypackage"
require("http://module.loader.com/?get=mypackage/foo/bar.js")
</pre>  


[CommonJS]:(http://commonjs.org/)
[Transquire]:(http://github.com/Gozala/require-js)
[package]:(http://wiki.commonjs.org/wiki/Packages)
[URI]:(http://en.wikipedia.org/wiki/Uniform_Resource_Identifier)