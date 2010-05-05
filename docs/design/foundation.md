Teleport: Package mapping
===========================

This high-level design document outlines how [Teleport] builds a [CommonJS] system in a browser. Design goal is to bring [CommonJS] system but preserve simplicity of current web development model, with zero tooling setup. Design relays on URI's that are capable to identify any module or a package and provides bidirectional **URI** ~ **ID** translation scheme allowing deterministic delivery of package module requirements, regardless of a platform and a package manager. Design solves module id conflicts by namespacing them under unique package name, leaving flexibility of platform specific overlays possible using custom URI schemes. Intention of this document is to answer fundamental questions:

What is package
---------------
> 
[CommonJS packages](package) are distributed [CommonJS] programs or libraries. It is a cohesive wrapping of a collection of modules, code and other assets into a single form. It provides the basis for convenient delivery of CommonJS components. In order to avoid complexity this document suggests to think of package as a valid [URI] under which package content can be reached.  
*Examples:*

* Package under http *(likely most common scenario)*  
[http://github.com/Gozala/taskhub/](http://github.com/Gozala/taskhub/raw/gh-pages/)  
according to the [package specs](package) descriptor should be under  
[http://github.com/Gozala/taskhub/package.json](http://github.com/Gozala/taskhub/raw/gh-pages/package.json)
 
* Package under chrome uri *(firefox extensions)*  
[chrome://mypackage/content/](chrome://mypackage/content/)  
according to the [package specs](package) descriptor should be under  
[chrome://mypackage/content/package.json](chrome://mypackage/content/package.json)

* Package under local file system *(offline apps)*     
[file:///usr/lib/mymodule/](file:///usr/lib/mymodule/)  
according to the [package specs](package) descriptor should be under  
[file:///usr/lib/mymodule/package.json](file:///usr/lib/mymodule/package.json)


How are package ID's derived  
----------------------------

> 
According to the existing CommonJS [package] specs each package has a name. Which effectively can be used as a unique ID. There is no guarantee that it will be unique, but most likely community will avoid naming conflicts of packages, with a help of platform providers which will make sure to have unique name per package in it's catalog. Probably [CommonJS] will get some sort of package registry helping developers in avoiding naming conflicts. From the experience from other languages it is not an issue. Document further assumes that package name is unique.  


How are dependencies declared
-----------------------------
> 
Existing CommonJS [package] specification describes a way of declaring dependencies. "Where to retrieve dependent package from" is a separate concern. Program should provide necessary pointers for it's dependencies to a platform. It is important to notice that non program packages delegate responsibility of providing pointers to a program since they are going to be consumers. In an example of [Transquire] *(and hopefully this will find it's way to CommonJS)* pointers are provided in a **catalog.json** in of program package.  
Each key in the **catalog.json** represents a name of the package it depends on. Corresponding value is a "pointer" hash with must have **uri** field and a value of a unique package [URI] *(described in a first section of this document)*. It is expected that package managers will generate **catalog.json** files where "pointer's" will be a corresponding package descriptors with additional **uri** field. In order to support design goal of zero tolling, [Teleport] expects to find only **uri** + other package descriptor field that have non default values.  
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
As it was mention in a first section package is an [URI] and. There for all the contained modules can be translated to a sub [URI]'s. This paradigm provides enough space for creating interoperable reusable modules that can be used in any environment, regardless of package manager. Just like in browser any javascript code can be loaded by its unique URI so in CommonJS any module can be required by it's unique URI regardless of a package it happened to be contained in: 
<pre class="console">require("<a href="http://github.com/Gozala/taskhub/blob/gh-pages/lib/taskhub/main.js">http://github.com/Gozala/taskhub/lib/main.js</a>");</pre>
> There are some obvious issues with this use case:  
>
* Long module identifiers
* Change of module host may invalidates third party codebase.

> To address this issues program packages are mandated to provide a "pointers" to it's (nested) dependency packages. Having that in place, example above can be translated to something that is expected to be used instead: 
<pre class="console">require("<a href="http://github.com/Gozala/taskhub/blob/gh-pages/lib/taskhub/main.js">taskhub/main</a>");</pre>
Please notice that this is fully spec compatible use of require. Details of URI to id translation are described below:
> 
1. **"http://github.com/Gozala/taskhub/" ~ "taskhub"**  
Package URI translates to a corresponding package name. In an example of **catalog.json** from previous section **taskhub** package points to a **http://github.com/Gozala/taskhub/** uri.
2. **"lib/" ~ ""**  
Directory containing module translates to an empty string. According to the CommonJS [package] descriptor specs default lib directory is **lib/**.
3. **main.js ~ main**  
Module path within the package lib remains same just a **.js** extension is being stripped out as required according in specs.   
> 
Obviously translation back is also possible by following the logic:
>
1. **"taskhub" ~ "http://github.com/Gozala/taskhub/"**  
Since module id is not top level and is not uri. **"taskhub"** package should be in catalog. In our example **"taskhub"** package points to a **http://github.com/Gozala/taskhub/**
2. **"" ~ "lib/"**  
Package uri should be followed by a directory name containing modules, which is defined in package descriptor *(& may be copied to a catalog for simpler lookups)* or might default to **"lib/"** like in our example.
3. **main ~ main.js**  
Module path within the package lib remains same expect a file extension **".js"** which is appended.   
> 
**Please note**: Some platforms may depend on a query params, for that scenarios URI's to a modules are resolved according to an example below:

<pre class="console">
// package "mypackage"
require("http://module.loader.com/?get=mypackage")
// module "foo/bar" from "mypackage"
require("http://module.loader.com/?get=mypackage/foo/bar.js")
</pre>  


[CommonJS]:(http://commonjs.org/)
[Teleport]:(http://github.com/Gozala/teleport/)
[package]:(http://wiki.commonjs.org/wiki/Packages)
[URI]:(http://en.wikipedia.org/wiki/Uniform_Resource_Identifier)