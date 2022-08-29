# Web-types

## web-component-analyzer usage

### With package.json configuration

You can add a `wca` section in your `package.json` to configure wca for web-types build.

```json
"wca": {
  "webtypesConfig": {
    "name": "your-project-name",
    "version": "0.0.1",
    "framework": "lit",
    "description-markup": "markdown"
  }
}
```

To run wca then use command:

```bash
wca analyze src --format webtypes --outFile web-types-custom.json
```

If you run `wca` from project npm `scripts` section of `package.json`, you can omit `name` and `version` property
in `webtypesConfig`, this will take package `name` and `version` by default.

### With command line only

You can also avoid updating `package.json` `wca` section and use only command line by providing a json configuration to `--webtypesConfig` argument:

```bash
wca analyze src --format webtypes --outFile web-types-custom.json --webtypesConfig='{"name": "your-project-name", "version": "0.0.1", "framework": "lit", "description-markup": "markdown"}'
```

If you run `wca` from project npm `scripts` section of `package.json`, you can omit `name` and `version` property
in `webtypesConfig`, this will take package `name` and `version` by default.

## Project setup

### For Lit

Generated web-types are working with the generic `lit-web-types` library. You need to add it on your project.

<!-- prettier-ignore -->
```bash
npm i lit-web-types -D
```

Add `wca` section in your `package.json`:

```json
"wca": {
  "webtypesConfig": {
    "framework": "lit",
    "description-markup": "markdown"
  }
}
```

Working with lit, `framework` must have `lit` value. See [Web types config parameters](#web-types-config-parameters) documentation section for more info.

Add `scripts` section in your `package.json`:

```json
"scripts": {
  "web-types": "wca analyze src --format webtypes --outFile web-types.json"
}
```

Generate your components descriptions with wca

<!-- prettier-ignore -->
```bash
npm web-types
```

If your web-types is not named `web-types.json` and placed at root of your project, you need to declare it in your `package.json`

```json
"web-types": [
  "..../web-types-custom.json"
]
```

After the first setup on Intellij, IDE restart might be needed to enable components completion.

### For Polymer

Generated web-types are working with the generic `polymer-web-types` library. You need to add it on your project.

<!-- prettier-ignore -->
```bash
npm i polymer-web-types -D
```

Add `wca` section in your `package.json`:

```json
"wca": {
  "webtypesConfig": {
    "framework": "@polymer/polymer",
    "description-markup": "markdown"
  }
}
```

Working with lit, `framework` must have `@polymer/polymer` value. See [Web types config parameters](#web-types-config-parameters) documentation section for more info.

Add `scripts` section in your `package.json`:

```json
"scripts": {
  "web-types": "wca analyze src --format webtypes --outFile web-types.json"
}
```

Generate your components descriptions with wca

<!-- prettier-ignore -->
```bash
npm web-types
```

If your web-types is not named `web-types.json` and placed at root of your project, you need to declare it in your `package.json`

```json
"web-types": [
  "..../web-types-custom.json"
]
```

After the first setup on Intellij, IDE restart might be needed to enable components completion.

## Web types config parameters

`webtypesConfig` parameter is a json object containing web-types file root parameter.

Available parameters:

| Name               | Description                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| name               | Name of library                                                                                               |
| version            | Version of the library, for which Web-Types are provided                                                      |
| framework          | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) framework section          |
| js-types-syntax    | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) js-types-syntax section    |
| description-markup | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) description-markup section |
| framework-config   | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) framework-config section   |
| default-icon       | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) default-icon section       |
| path-as-absolute   | Consider paths as absolute: don't add './' in front of paths                                                  |

See [web-types project:](https://github.com/JetBrains/web-types) for more info.
