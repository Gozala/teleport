# Change Log #

## 0.2.7 ##

- Renamed virtualized directory "packages" -> "support".
- Packages are now accessible under `localhost/{{name}}` instead of
  `localhost/packages/{{name}}`
- Teleport dashboard was factored out to a separate project so that it's
  dependencies won't be inherited by dependant packages.
- Foundation for `teleport reflect` command.

## 0.2.6 ##

- Fixed bug that preventing teleport activation from non-package directories.
- Removed legacy modules.

## 0.2.5 ##

- Updated APIs to work with new version of NPM (0.2.14-4).

## 0.2.4 ##

- Teleport now can work with multiple packages / apps at in parallel.
- [Teleport dashboard](http://localhost:4747/packages/teleport/) is a tool
  for visualizing all the installed packages, containing modules and meta-data.
- In Firefox module JS version 1.8. is used by default.
- IE compatible module loader.
- Adding support for nested & sub-nested dependencies.
- Support for "data-main" for defining main modules.

## 0.2.3 ##

- Teleport playground is loaded for 404 pages allowing to play with a modules
  for the given package.
- Basic support for self updating on package descriptor changes.
- Simplified beginners guide.

## 0.2.2 ##

- Fixes in beginners guide.

## 0.2.1 ##

- Adding `teleport bundle` command that mirrors given package & it's
  dependencies so that they can be used from local filesystem without any
  server.

## 0.2.0 ##

- Initial lunch of completely redesigned tool.
