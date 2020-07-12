# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/)

<!-- # Unreleased -->
<!-- ### Added -->
<!-- ### Changed -->
<!-- ### Removed -->
<!-- ### Fixed -->

## [1.1.0] - 2020-07-12

### Fixed

- Improved logic for resolving declarations and mixins ([#172](https://github.com/runem/web-component-analyzer/issues/172))
- Added support for JSDoc syntax where type comes after name (eg. `@fires my-event {MouseEvent}`) ([#165](https://github.com/runem/web-component-analyzer/issues/165))
- Event types are now inferred correctly and all events are now analyzed instead of only `CustomEvent` (https://github.com/runem/web-component-analyzer/issues/165)

### Added

- JSDoc related utils are now exported from WCA ([#171](https://github.com/runem/web-component-analyzer/pull/171))
- `hasUpdated` and `updateComplete` are now considered protected members for `LitElement` elements (https://github.com/runem/web-component-analyzer/pull/166)
- Updated all dependencies.
- It's now possible to traverse the entire inheritance tree using `declaration.heritageClauses`.
- Added `--inline-types` CLI option that can be used to expand type aliases in order to inline types in the documentation ([#140](https://github.com/runem/web-component-analyzer/issues/140))

## [1.0.2] - 2020-01-18

### Fixed

- Fixed various problems when analyzing globs using the CLI on Windows
- Fixed problem where discovering global features would not detect all feature
- Fixed problems with the `analyzeHtmlElement` function
- Fixed problem with resolving the value of `PrefixUnaryExpression` nodes. ([#132](https://github.com/runem/web-component-analyzer/issues/132))

### Added

- The CLI now supports `--silent` flag that prevents it from outputting progress to the console
- The CLI now supports `--markdown.headerLevel` flag that sets the starting header level for the markdown format

## [1.0.0] - 2019-12-01

### Added

- Methods are now analyzed
- `@private`, `@protected`, `@public` and `@access` jsdoc tags are now support ([#106](https://github.com/runem/web-component-analyzer/issues/106)), ([#126](https://github.com/runem/web-component-analyzer/issues/126)) ([#105](https://github.com/runem/web-component-analyzer/issues/105))
- It's now possible to choose if private and/or protected members should be included in the output using `--visibility protected` CLI option ([#112](https://github.com/runem/web-component-analyzer/issues/112))
- JSX typescript declaration files are now support (IntrinsicAttributes and IntrinsicElements) ([#116](https://github.com/runem/web-component-analyzer/issues/116))
- Support for extending HTMLElement with members using Typescript declaration files
- A list of used mixins for a given component is now included in the markdown output
- Support for the `@deprecated` jsdoc tag ([#103](https://github.com/runem/web-component-analyzer/issues/103))
- Support for specifying default css property values: `@cssproperty {Color} [--my-color=red]`
- `default` is now included in the json format for attributes, properties and css custom properties
- `deprecated` is now included in the json format for attributes, properties and events ([#103](https://github.com/runem/web-component-analyzer/issues/103))
- The library ships with different module formats `esm` and `cjs` split in two modules `api` and `cli`. This makes it possible to use WCA in the browser ([#118](https://github.com/runem/web-component-analyzer/issues/118))
- It's now possible to specify which featues should be analyzed
- Emitted members now include metadata that flavors can add (eg. LitElement specific metadata)
- Examples added using the `@example` jsdoc tag will be included in the markdown format.
- Getter are now also analyzed, making it possible to emit `readonly` properties.
- Support for the `@readonly` jsdoc tag
- Support `@param` and `@returns` jsdoc tags
- Support `@ignore` jsdoc tag
- Add new flag to the CLI called `--outFiles`. This flag can take special values such as {dir}, {tagname} and {filename}. Read `--help` to learn more.
- Add new flag to the CLI called `--dry` to test the analyzer without writing files.

### Removed

- It's no longer possible to emit diagnostics using the CLI
- `jsDoc` has been removed from the json format

### Fixed

- Big internal refactor, including adding a lot of tests
- Improved merging of component features ([#101](https://github.com/runem/web-component-analyzer/issues/101)), ([#124](https://github.com/runem/web-component-analyzer/issues/124))
- Improved performance by using caching and lazy evaluation where appropriate
- Improved support for `@type` jsdoc ([#67](https://github.com/runem/web-component-analyzer/issues/67))
- Improved jsdoc tag parsing. Default notation like `@attr {string} [my-attr=123]` is now supported
- Using an object literal as `default` value no longer truncates to the first letter ([#102](https://github.com/runem/web-component-analyzer/issues/102))
- Fixed problems with some default values ([#130](https://github.com/runem/web-component-analyzer/issues/130))
