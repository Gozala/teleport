'use strict'

var markdown = require('markdown-js')
  , http = require('promised-http')
  , q = require('q'), when = q.when
  , system = require('system')
  , mustache = require('mustache')
  , _ = require('underscore')._
  , backbone = require('backbone'), View = backbone.View
  , Controller = backbone.Controller, Model = backbone.Model
  , Collection = backbone.Collection

  , packages
  , controller
  , app

/*
var registryTemplate =
[ '{{#packages}}'
, '<section class="package">'
, '   <a href="#package:{{name}}">'
, '     <span class="name">{{name}}</span>'
, '     <span class="version">{{version}}</span>'
, '   </a>'
, '   <span class="description">{{description}}</span>'
, '{{#author}}   <span class="author">{{author}}</span>{{/author}}'
, '</section>'
, '{{/packages}}'
].join('\n')

function isDoc(data) {
  return 0 > data.indexOf(':') && data.length
}

function load(data) {
  var content, element, json
  if (isDoc(data)) {
    content = when(http.request('docs/' + data + '.md'), markdown.parse)
    element = document.getElementById(data)
    when(content, function(content) { element.innerHTML = content })
  } else {
    when(http.request('/packages/registry.json'), function (data) {
      content = JSON.parse(data)
      data = { packages: [] }
      for (var name in content) data.packages.push(content[name])
      document.getElementById('packages').innerHTML =
        mustache.to_html(registryTemplate, data)
    })
  }
}

exports.main = function main() {
  system.stdin.on('data', load)
  load(window.location.hash.substr(1))
}
*/
// Overriding backbone `sync` in order to use `promised-request` instead of
// jQuery ajax.
backbone.sync = function(method, model, success, error) {
  when(http.request(model.url), success, error)
}
// Backbone's default make uses jQuery function that we don't have so we need
// to override it to use standard DOM APIs instead.
View.prototype.make = function make(tagName, attributes, content) {
  var name, element = document.createElement(tagName)
  if (attributes) {
    for (name in attributes)
      // jQuery uses classname for class since last one is reserved.
      element.setAttribute('className' == name ? 'class' : name, attributes[name])
  }
  if (content) element.innerHTML = content

  return element
}

var Package = Model.extend(
{ initialize: function initialize(options) {
    this.id = options.name
  }
, clear: function clear() {
    this.destroy()
    this.view.remove()
  }
})
exports.Package = Package

var Packages = Collection.extend(
{ model: Package
, url: '../registry.json'
  // Currently selected package.
, selected: null
, parse: function parse(content) {
    var value = [], packages = JSON.parse(content)
    for (var name in packages) value.push(packages[name])
    return value
  }
})
exports.Packages = Packages

var PackageView = View.extend(
{ tagName: 'section'
, className: 'package'
, template:
  [ '<a href="#package={{name}}">'
  , '  <span class="name">{{name}}</span>'
  , '  <span class="version">{{version}}</span>'
  , ' </a>'
  ].join('\n')
, initialize: function initialize(options) {
    _.bindAll(this, 'render')
    this.model.bind('change', this.render)
    this.model.view = this
  }
, render: function render() {
    this.el.innerHTML = mustache.to_html(this.template, this.model.toJSON())
    return this
  }
, clear: function clear() {
    this.model.clear()
  }
})
exports.PackageView = PackageView

var PackageDetailsView = View.extend(
{ el: document.getElementById('package-details')
, template:
  [ '<h2 class="name"><a href="/packages/{{name}}/">{{name}}</a></h2>'
  , '{{#description}}<div class="description">{{description}}</div>{{/description}}'
  , '<br/>'
  , '<div class="vesion">Version: {{version}}<div>'
  , '{{#author}}<div class="author">Author: {{author}}</div>{{/author}}'
  , '{{#homepage}}<div class="homepage">Homepage: <a href="{{homepage}}">{{homepage}}</a>{{/homepage}}'
  ].join('\n')
, render: function render() {
    console.log(this.model.toJSON())
    this.el.innerHTML = mustache.to_html(this.template, this.model.toJSON())
    return this
  }
, clear: function clear() {
    this.el.innerHTML = ''
  }
})
exports.PackageDetailsView = PackageDetailsView

var AppView = View.extend(
{ el: document.getElementById('packages')
, packageDetailsView: null
, initialize: function initialize() {
    this.packageDetailsView = new PackageDetailsView
    _.bindAll(this, 'add', 'refresh')
    packages.bind('add', this.add)
    packages.bind('refresh', this.refresh)
    packages.fetch()
    backbone.history.start()
  }
, add: function add(model) {
    var view = new PackageView({ model: model })
    this.el.appendChild(view.render().el)
  }
, refresh: function refresh() {
    packages.each(this.add)
    backbone.history.loadUrl()
  }
})
exports.AppView = AppView

var AppController = Controller.extend(
{ routes:
  { "package=:name": 'select'
  }
  , select: function select(name) {
    var model = packages.get(name)
      , view = app.packageDetailsView

    if (model !== view.model) {
      view.model = model
      view.render()
    }
  }
})
exports.AppController = AppController
controller = new AppController


exports.packages = packages = new Packages
backbone.history.start = function () {
  window.addEventListener('hashchange', this.checkUrl, false)
}

window.controller = controller
window.packages = packages

if (require.main == module) app = new AppView
