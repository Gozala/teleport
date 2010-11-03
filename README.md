teleport
========

With a [CommonJS] we finally have interoperable modules, that can be loaded on
variety of platforms. With help of awesome [npm] we can manage different
JavaScript libraries without needs of visiting websites or manually downloading
anything. Can't we have the same experience with browsers side development ?

That's exactly what teleport is about!

### Install ###

    npm install teleport

### Guide ###

Writing webapps with teleport is super easy! It does not requires any special
treatment only thing you have to do is activate it. Teleport allows you to load
any module from any package that was installed or linked by your npm
installation. Here is a simple tutorial to get started:

- All the packages in npm are [CommonJS package] and so should be your app, so
  first of all you should create folder with a package.json in it. Below is
  a very basic sample of the `package.json`. For more examples on try
  `npm help json`.

        { "name": "demo"
        , "version": "0.0.1"
        , "description": "Demo App."
        , "dependencies": { "mustache": ">=0.3.0" }
        , "engines": { "teleport": ">=0.2.0" }
        }

- Our app will depend on [underscore], that's why it's listed in dependencies.
  Let's actually install underscore by running:

        npm install mustache

- Next we also want to make npm aware of our app that's why we're going to link
  it:

        npm link

- Now we need some html for our web app.

        <!DOCTYPE html>
        <html>
          <head>
            <title>Demo</title>
            <link type="text/css" rel="stylesheet" href="resources/css/style.css"/>
            <script type="text/javascript" src="packages/teleport.js"></script>
            <script type="text/javascript">require.main('demo/app')</script>
          </head>
          <body></body>
        </html>

- And our demo app logic under `lib/app.js`

        var mustache = require('mustache')
        exports.main = function main() {
          console.log(mustache.to_html('Helo {{name}}', { name: 'teleport' }))
        }
        // run our module as program if loaded as main.
        if (require.main == module) exports.main()

- Finally we can activate teleport and check results on http://localhost:4747/

        teleport activate

Teleport can remain active during development. All the changes will
automatically be picked up. So start making changes now and just hit refresh
to test!

[underscore]:http://documentcloud.github.com/underscore/
[CommonJS]:http://wiki.commonjs.org/wiki/Packages/1.1
[nodejs]:http://nodejs.org/
[npm]:http://npmjs.org/
