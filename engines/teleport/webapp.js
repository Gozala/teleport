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
    for (var name in packages) {
      var data = packages[name].overlay.teleport
      data.modules = Object.keys(data.modules).map(function(id) {
        id = id ? name + '/' + id : name
        return {
          id: id,
          src: encodeURIComponent(id),
          path: name  + data.modules[id]
        }
      })
      value.push(data)
    }
    return value
  }
})
exports.Packages = Packages

var PackageView = View.extend(
{ tagName: 'section'
, className: 'package'
, template:
  [ '<a href="#packages/{{name}}">'
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
    var data = this.model.toJSON()
    this.el.innerHTML = mustache.to_html(this.template, data)
    this.el.setAttribute('data-active', !!data.active)
    this.el.setAttribute('data-broken', !!data.error)
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
  [ '<h2 class="name"><a href="/support/{{name}}/">{{name}}</a></h2>'
  , '{{#description}}<div class="description">{{description}}</div>{{/description}}'
  , '<br/>'
  , '{{#version}}<div class="vesion">Version: {{version}}<div>{{/version}}'
  , '{{#author}}<div class="author">Author: {{author}}</div>{{/author}}'
  , '{{#homepage}}<div class="homepage">Homepage: <a href="{{homepage}}">{{homepage}}</a>{{/homepage}}'
  , '<div class="modules"><br/>{{#modules}}<a href="#packages/{{name}}/modules/{{src}}" class="module fixed">{{id}}</a>{{/modules}}</div>'
  ].join('\n')
, render: function render() {
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
  { "packages/:name": 'select'
  , "packages/:name/moudles/:id": 'select'
  }
  , select: function select(name, id) {
    console.log(arguments)
    var model = packages.get(name)
      , view = app.packageDetailsView

    if (model !== view.model) {
      if (view.model) view.model.set({ active: false })
      model.set({ active: true })
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
