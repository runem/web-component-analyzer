# Web-types

## Project setup

### For Lit

Generated web-types are working with the generic `lit-web-types` library. You need to add it on your project.

<!-- prettier-ignore -->
```bash
npm i lit-web-types -D
```

Generate your components descriptions with wca

<!-- prettier-ignore -->
```bash
wca analyze src --format webtypes --outFile web-types-custom.json --webtypesConfig='{"name": "web-types-custom", "version": "0.0.1", "description-markup": "markdown", "framework": "lit"}'
```

`--webtypesConfig` is a json object of web-types root parameters. Working with lit, `framework` must have `lit` value.
See "Web types config parameters" documentation section for more info.

Link your generated web-types file in your package.json

```json
{
  ...,
  "web-types": [
    "./web-types-custom.json"
  ]
}
```

After the first setup on Intellij, IDE restart might be needed to enable components completion.

### For Polymer

Generated web-types are working with the generic `polymer-web-types` library. You need to add it on your project.

<!-- prettier-ignore -->
```bash
npm i polymer-web-types -D
```

Generate your components descriptions with wca

<!-- prettier-ignore -->
```bash
wca analyze src --format webtypes --outFile web-types-custom.json --webtypesConfig='{"name": "web-types-custom", "version": "0.0.1", "description-markup": "markdown", "framework": "@polymer/polymer"}'
```

`--webtypesConfig` is a json object of web-types root parameters. Working with polymer, `framework` must have `@polymer/polymer` value.
See "Web types config parameters" documentation section for more info.

Link your generated web-types file in your package.json

```json
{
  ...,
  "web-types": [
    "./web-types-custom.json"
  ]
}
```

After the first setup on Intellij, IDE restart might be needed to enable components completion.

## Web types config parameters

`--webtypesConfig` parameter is a json object containing web-types file root parameter.

Available parameters:

| Name               | Description                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| name               | Name of library, mandatory option                                                                             |
| version            | Version of the library, for which Web-Types are provided, mandatory option                                    |
| framework          | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) framework section          |
| js-types-syntax    | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) js-types-syntax section    |
| description-markup | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) description-markup section |
| framework-config   | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) framework-config section   |
| default-icon       | See [http://json.schemastore.org/web-types](http://json.schemastore.org/web-types) default-icon section       |

See [web-types project:](https://github.com/JetBrains/web-types) for more info.
