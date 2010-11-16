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

<pre class="textmate-source twilight"><span class="source source_js"><span class="meta meta_brace meta_brace_curly meta_brace_curly_js">{</span> <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>name<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>hello-world<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>
<span class="meta meta_delimiter meta_delimiter_object meta_delimiter_object_comma meta_delimiter_object_comma_js">, </span><span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>version<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>0.0.1<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>
<span class="meta meta_delimiter meta_delimiter_object meta_delimiter_object_comma meta_delimiter_object_comma_js">, </span><span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>description<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>My first teleport app.<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>
<span class="meta meta_delimiter meta_delimiter_object meta_delimiter_object_comma meta_delimiter_object_comma_js">, </span><span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>dependencies<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">{</span> <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>mustache<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>&gt;=0.3.0<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span> <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">}</span>
<span class="meta meta_delimiter meta_delimiter_object meta_delimiter_object_comma meta_delimiter_object_comma_js">, </span><span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>engines<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">{</span> <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>teleport<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span>: <span class="string string_quoted string_quoted_double string_quoted_double_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">"</span>&gt;=0.2.0<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">"</span></span> <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">}</span>
<span class="meta meta_brace meta_brace_curly meta_brace_curly_js">}</span></span></pre>

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

<pre class="textmate-source twilight"><span class="source source_js"><span class="storage storage_type storage_type_js">var</span> mustache <span class="keyword keyword_operator keyword_operator_js">=</span> require<span class="meta meta_brace meta_brace_round meta_brace_round_js">(</span><span class="string string_quoted string_quoted_single string_quoted_single_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">'</span>mustache<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">'</span></span><span class="meta meta_brace meta_brace_round meta_brace_round_js">)</span>
exports<span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>main <span class="keyword keyword_operator keyword_operator_js">=</span> <span class="meta meta_function meta_function_js"><span class="storage storage_type storage_type_function storage_type_function_js">function</span> <span class="entity entity_name entity_name_function entity_name_function_js">main</span><span class="punctuation punctuation_definition punctuation_definition_parameters punctuation_definition_parameters_begin punctuation_definition_parameters_begin_js">(</span><span class="punctuation punctuation_definition punctuation_definition_parameters punctuation_definition_parameters_end punctuation_definition_parameters_end_js">)</span></span> <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">{</span>
  <span class="support support_class support_class_js">document</span><span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span><span class="support support_constant support_constant_dom support_constant_dom_js">body</span><span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>innerHTML <span class="keyword keyword_operator keyword_operator_js">=</span> mustache<span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>to_html<span class="meta meta_brace meta_brace_round meta_brace_round_js">(</span><span class="string string_quoted string_quoted_single string_quoted_single_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">'</span>Hello {{name}}<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">'</span></span><span class="meta meta_delimiter meta_delimiter_object meta_delimiter_object_comma meta_delimiter_object_comma_js">, </span><span class="meta meta_brace meta_brace_curly meta_brace_curly_js">{</span> name: <span class="string string_quoted string_quoted_single string_quoted_single_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">'</span>world<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">'</span></span> <span class="meta meta_brace meta_brace_curly meta_brace_curly_js">}</span><span class="meta meta_brace meta_brace_round meta_brace_round_js">)</span>
<span class="meta meta_brace meta_brace_curly meta_brace_curly_js">}</span>
<span class="comment comment_line comment_line_double-slash comment_line_double-slash_js"><span class="punctuation punctuation_definition punctuation_definition_comment punctuation_definition_comment_js">//</span> Executing main function if module loaded as a program.
</span><span class="keyword keyword_control keyword_control_js">if</span> <span class="meta meta_brace meta_brace_round meta_brace_round_js">(</span>module <span class="keyword keyword_operator keyword_operator_js">==</span> require<span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>main<span class="meta meta_brace meta_brace_round meta_brace_round_js">)</span> exports<span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>main<span class="meta meta_brace meta_brace_round meta_brace_round_js">()</span>
</span></pre>

Now we need a page where where our app will be loaded. So lets create
`"index.html"` in the root of our package with a following content:

<pre class="textmate-source twilight"><span class="text text_html text_html_basic"><span class="meta meta_tag meta_tag_sgml meta_tag_sgml_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;!</span><span class="meta meta_tag meta_tag_sgml meta_tag_sgml_doctype meta_tag_sgml_doctype_html"><span class="entity entity_name entity_name_tag entity_name_tag_doctype entity_name_tag_doctype_html">DOCTYPE</span> html</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
<span class="meta meta_tag meta_tag_structure meta_tag_structure_any meta_tag_structure_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_structure entity_name_tag_structure_any entity_name_tag_structure_any_html">html</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
  <span class="meta meta_tag meta_tag_structure meta_tag_structure_any meta_tag_structure_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_structure entity_name_tag_structure_any entity_name_tag_structure_any_html">head</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
    <span class="meta meta_tag meta_tag_inline meta_tag_inline_any meta_tag_inline_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_begin punctuation_definition_tag_begin_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_inline entity_name_tag_inline_any entity_name_tag_inline_any_html">title</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_end punctuation_definition_tag_end_html">&gt;</span></span>Teleport demo app.<span class="meta meta_tag meta_tag_inline meta_tag_inline_any meta_tag_inline_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_begin punctuation_definition_tag_begin_html">&lt;/</span><span class="entity entity_name entity_name_tag entity_name_tag_inline entity_name_tag_inline_any entity_name_tag_inline_any_html">title</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_end punctuation_definition_tag_end_html">&gt;</span></span>
<span class="source_js source_js_embedded source_js_embedded_html">    <span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_script entity_name_tag_script_html">script</span> <span class="entity entity_other entity_other_attribute-name entity_other_attribute-name_html">type</span>=<span class="string string_quoted string_quoted_double string_quoted_double_html"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_html">"</span>text/javascript<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_html">"</span></span> <span class="entity entity_other entity_other_attribute-name entity_other_attribute-name_html">src</span>=<span class="string string_quoted string_quoted_double string_quoted_double_html"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_html">"</span>packages/teleport.js<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_html">"</span></span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;&lt;/</span><span class="entity entity_name entity_name_tag entity_name_tag_script entity_name_tag_script_html">script</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span>
</span><span class="source_js source_js_embedded source_js_embedded_html">    <span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_script entity_name_tag_script_html">script</span> <span class="entity entity_other entity_other_attribute-name entity_other_attribute-name_html">type</span>=<span class="string string_quoted string_quoted_double string_quoted_double_html"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_html">"</span>text/javascript<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_html">"</span></span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span>require<span class="meta meta_delimiter meta_delimiter_method meta_delimiter_method_period meta_delimiter_method_period_js">.</span>main<span class="meta meta_brace meta_brace_round meta_brace_round_js">(</span><span class="string string_quoted string_quoted_single string_quoted_single_js"><span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_begin punctuation_definition_string_begin_js">'</span>hello-world/app<span class="punctuation punctuation_definition punctuation_definition_string punctuation_definition_string_end punctuation_definition_string_end_js">'</span></span><span class="meta meta_brace meta_brace_round meta_brace_round_js">)</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;/</span><span class="entity entity_name entity_name_tag entity_name_tag_script entity_name_tag_script_html">script</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span>
</span>  <span class="meta meta_tag meta_tag_structure meta_tag_structure_any meta_tag_structure_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;/</span><span class="entity entity_name entity_name_tag entity_name_tag_structure entity_name_tag_structure_any entity_name_tag_structure_any_html">head</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
  <span class="meta meta_tag meta_tag_any meta_tag_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;</span><span class="entity entity_name entity_name_tag entity_name_tag_html">body</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;<span class="meta meta_scope meta_scope_between-tag-pair meta_scope_between-tag-pair_html">&lt;</span>/</span><span class="entity entity_name entity_name_tag entity_name_tag_html">body</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
<span class="meta meta_tag meta_tag_structure meta_tag_structure_any meta_tag_structure_any_html"><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&lt;/</span><span class="entity entity_name entity_name_tag entity_name_tag_structure entity_name_tag_structure_any entity_name_tag_structure_any_html">html</span><span class="punctuation punctuation_definition punctuation_definition_tag punctuation_definition_tag_html">&gt;</span></span>
</span></pre>

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
