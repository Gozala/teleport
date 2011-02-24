## Installing Teleport ##

If you haven’t yet installed teleport, it’s really easy if you have [npm]
installed on your machine. Just type:

    npm install teleport

And you are done!

## Creating Your First package ##

_All the materials created by this guide can be found 
[here](https://github.com/Gozala/teleport-demo)_

Since [npm] works with [CommonJS packages], first thing you want to do for any
new site / application is to create a new package. You can do it quickly with a
help of npm:

    npm init

In this case though we will do it manually to go through all the details. Lets
create a folder `"hello-world"` and `"package.json"` file in it that looks like
this:

<pre>
<span class="Braces">{</span>
  <span class="String">&quot;name&quot;</span><span class="Operators">:</span> <span class="String">&quot;hello-world&quot;</span><span class="Operators">,</span>
  <span class="String">&quot;version&quot;</span><span class="Operators">:</span> <span class="String">&quot;0.0.1&quot;</span><span class="Operators">,</span>
  <span class="String">&quot;description&quot;</span><span class="Operators">:</span> <span class="String">&quot;My first teleport app.&quot;</span><span class="Operators">,</span>
  <span class="String">&quot;dependencies&quot;</span><span class="Operators">:</span> <span class="Braces">{</span> <span class="String">&quot;mustache&quot;</span><span class="Operators">:</span> <span class="String">&quot;&gt;=0.3.0&quot;</span> <span class="Braces">}</span><span class="Operators">,</span>
  <span class="String">&quot;engines&quot;</span><span class="Operators">:</span> <span class="Braces">{</span> <span class="String">&quot;teleport&quot;</span><span class="Operators">:</span> <span class="String">&quot;&gt;=0.2.0&quot;</span> <span class="Braces">}</span>
<span class="Braces">}</span>
</pre>

It's highly recommended to get familiar with [CommonJS packages]. If you have
already written your firs CommonJS package everything should be pretty clear.
Finally we need to link our package to the npm registry by running command:

    npm link

from the `"hello-world"` directory. Please note that [mustache] library listed
under the `dependencies` field will be installed by npm during linking.

## Writing application ##

Now lets write create a first module, to do so we need to create file
`"app.js"` under the `"lib"` directory of our package with a following
content:

<pre>
<span class="Identifier">var</span> mustache <span class="Operators">=</span> <span class="Keyword">require</span><span class="Parens">(</span><span class="String">'mustache'</span><span class="Parens">)</span>
<span class="Keyword">exports</span><span class="Operators">.</span>main <span class="Operators">=</span> <span class="Function">function</span> main<span class="Parens">()</span> <span class="Braces">{</span>
  <span class="Keyword">document</span><span class="Operators">.</span>body<span class="Operators">.</span>innerHTML <span class="Operators">=</span> mustache<span class="Operators">.</span>to_html<span class="Parens">(</span><span class="String">'Hello {{name}}'</span><span class="Operators">,</span> <span class="Braces">{</span> name<span class="Operators">:</span> <span class="String">'world'</span> <span class="Braces">}</span><span class="Parens">)</span>
<span class="Braces">}</span>
<span class="Comment">// Executing main function if module loaded as a program.</span>
<span class="Statement">if</span> <span class="Parens">(</span>module <span class="Operators">==</span> <span class="Keyword">require</span><span class="Operators">.</span>main<span class="Parens">)</span> <span class="Keyword">exports</span><span class="Operators">.</span>main<span class="Parens">()</span>
</pre>

Now we need a page where where our app will be loaded. So lets create
`"index.html"` in the root of our package with a following content:

<pre>
<span class="Comment">&lt;!DOCTYPE html&gt;</span>
<span class="Function">&lt;</span><span class="Statement">html</span><span class="Function">&gt;</span>
  <span class="Function">&lt;</span><span class="Statement">head</span><span class="Function">&gt;</span>
<span class="PreProc">    </span><span class="Function">&lt;</span><span class="Statement">title</span><span class="Function">&gt;</span><span class="Title">Teleport demo app.</span><span class="Identifier">&lt;/</span><span class="Statement">title</span><span class="Identifier">&gt;</span>
<span class="PreProc">    </span><span class="Function">&lt;</span><span class="Exception">script</span><span class="Function"> </span><span class="Type">type</span><span class="Function">=</span><span class="String">&quot;text/javascript&quot;</span><span class="Function"> </span><span class="Type">src</span><span class="Function">=</span><span class="String">&quot;packages/teleport.js&quot;</span><span class="Function">&gt;</span><span class="Identifier">&lt;/</span><span class="Exception">script</span><span class="Identifier">&gt;</span>
<span class="PreProc">    </span><span class="Function">&lt;</span><span class="Exception">script</span><span class="Function"> </span><span class="Type">type</span><span class="Function">=</span><span class="String">&quot;text/javascript&quot;</span><span class="Function">&gt;</span><span class="Keyword">require</span><span class="Operators">.</span><span class="Special">main</span><span class="Parens">(</span><span class="String">'hello-world/app'</span><span class="Parens">)</span><span class="Identifier">&lt;/</span><span class="Exception">script</span><span class="Identifier">&gt;</span>
<span class="PreProc">  </span><span class="Identifier">&lt;/</span><span class="Statement">head</span><span class="Identifier">&gt;</span>
  <span class="Function">&lt;</span><span class="Statement">body</span><span class="Function">&gt;</span><span class="Identifier">&lt;/</span><span class="Statement">body</span><span class="Identifier">&gt;</span>
<span class="Identifier">&lt;/</span><span class="Statement">html</span><span class="Identifier">&gt;</span>
</pre>

## Testing ##

You may have noticed script tag referring to `"packages/teleport.js"`. The file
does not exists there, but that's fine, ignore that for the moment we will look
into the details of that later. Second script tag contains little snippet of
code that loads our `"app"` module as a program. Finally we can test our
application by activating teleport, to do so run following command from the
package directory:


    teleport activate

You will see an output:

<pre>Teleport is activated <a href="http://127.0.0.1:4747" target="_blan">http://127.0.0.1:4747<a/></pre>

If you'll follow the link you will see our hello world application in action.
Of course there is room for improvement so you can go on hacking, to see the
only thing you will have to do is refresh your page.


## Sharing ###

To make your application / library available for others to install and depend on
you will have to publishing it _(no more download links!!)_. [npm] is just great
for that and it as easy as running following command form the package directory:

    npm publish

## Bundling ##

Pretty soon teleport will be distributed as middleware for a popular frameworks
like [connect] but even then, one might want to cut dependency on teleport. This
is absolutely legal requirement, actually teleport was designed with that in
mind, while primary focusing on development it has ability to distribute apps
without dependency on itself. To do that you only need to run following command
form the package directory:

    teleport bundle hello-world/app

`"hello-world/app"` is an id of the main module, the one we used to load as a
program from the html. Now you can open index.html from local file system and
it will work exactly the same as with a case from localhost.

## In depth look ##

You may already have looked at how modules are loaded and noticed that teleport
serves all the modules under the relative URLs:

    packages/<module/id>.js

`"packages"` is a virtual folder when teleport is active _(It is not
recommended to have same named folder in package)._ The rest of the path is
just an absolute module id with file extension. The modules served by teleport
are scrapped in [AMD] format so that browsers can handle them without an issues.
`"packages/teleport.js"` is a special case, it's a module loader that comes with
teleport, but I believe it should be possible to swap it with any other [AMD]
compatible module loader.

Virtual `"packages"` folder is one of the key details that allows distribution
of apps without dependency on teleport itself, cause bundle an app teleports
just copies a virtual folder with all it's scrapped modules in the local
filesystem.

**BTW** This page is also built with teleport and is a good example of a more
complicated app with support of multiple engines. Source of it can be found
under [the link](https://github.com/Gozala/teleport).

[AMD]:http://wiki.commonjs.org/wiki/Modules/AsynchronousDefinition
[connect]:http://senchalabs.github.com/connect/
[npm]:http://www.npmjs.org/ "Node package manager"
[mustache]:http://mustache.github.com/ "Popular template engine"
[CommonJS packages]:http://wiki.commonjs.org/wiki/Packages/1.1
[nodejs]:http://nodejs.org/
