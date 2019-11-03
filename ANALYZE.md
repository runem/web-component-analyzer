<h2 style="color: red">This document is still work in progress.</h2>

# Overview of what this library can analyze

This library is designed to analyze components no matter where they are found. This means it needs to find and analyze components in both javascript, typescript and in typescript definition files (when consumed from a library).

As you can see we loose a lot of information when the element is defined in a typescript definition file.

### Custom Elements

#### In your own code

<!-- prettier-ignore -->
```javascript
export class MyElement extends HTMLElement {

  myProp = "foo";

  static get observedAttributes() {
    return ["attr1", "attr2"];
  }
	
  set value (val) {
  }
}

customElements.define("my-element", MyElement);
```

- **Tag name**: `my-element`
- **Properties**: `value`, `myProp (String)`
- **Attributes**: `attr1`, `attr2`

#### In typescript definition files

<!-- prettier-ignore -->
```javascript
export class MyElement extends HTMLElement {
  myProp: string;
  static readonly observedAttributes: string[];
  value: string;
}

declare global {
    interface HTMLElementTagNameMap {
        "my-element": MyElement;
    }
}
```

- **Tag name**: `my-element`
- **Properties**: `value (String)`, `myProp (String)`
- **Attributes**: No attributes because `observedAttributes` is just a function that returns `string[]`

## [LitElement](https://lit-element.polymer-project.org/guide)

#### In your own code

<!-- prettier-ignore -->
```javascript
@customElement("my-element")
export class MyElement extends LitElement {

  myProp = "myProp";
	
  @property({type: String}) prop4 = "hello";

  @property({type: Boolean, attribute: "prop-5"}) prop5;
	
  static get properties() {
    return {
      prop1: { type: String },
      prop2: { type: Number, attribute: "prop-two" },
      prop3: { type: Boolean, attribute: false }
    };
  }

}
```

- **Tag name**: `my-element`
- **Properties**: `myProp (String)`, `prop1 (String)`, `prop2 (Number)`, `prop3 (Boolean)`, `prop4 (String)`, `prop5 (Boolean)`
- **Attributes**: `prop1 (String)`, `prop-two (Number)`, `prop4 (String)`, `prop-5 (Boolean)`,

#### In typescript definition files

<!-- prettier-ignore -->
```typescript
export class MyElement extends LitElement {
  myProp: string;
  prop4: string;
  prop5: string;
	
  static get properties(): Object;
}
```

## [Polymer](https://polymer-library.polymer-project.org/3.0/docs/first-element/step-3)

<!-- prettier-ignore -->
```javascript
class IconToggle extends PolymerElement {
  static get properties () {
    return {
      toggleIcon: {
        type: String
      }
    };
  }
}
```

## [Stencil](https://stenciljs.com/)

#### In your own code

<h5 style="color: red">This is not supported yet.</h5>

<!-- prettier-ignore -->
```typescript
import { Component, Prop, EventEmitter } from '@stencil/core';

@Component({
  tag: 'my-embedded-component'
})
export class MyEmbeddedComponent {
  @Prop() color: string = 'blue';
  @Event() change: EventEmitter;
  @Event({eventName: 'todoCompleted'}) todoCompleted: EventEmitter;

  render() {
    return (
      <div>My favorite color is {this.color}</div>
    );
  }
}
```

- **Tag name**: `my-embedded-component`
- **Properties**: `color (String)`
- **Attributes**: `color (String)`
- **Events**: `change`, `todoCompleted`

### In typescript definition files

When building Stencil components the compiler spits out alot of typescript definition files that describe both attributes and properties. These are parsed by this library. `StencilIntrinsicElements` is of interest because it describes the attributes of the element.

<!-- prettier-ignore -->
```typescript
import './stencil.core';

export namespace Components {
  interface ProgressRing {
    'decimalSize': number;
  }
  interface ProgressRingAttributes extends StencilHTMLAttributes {
    'decimalSize'?: number;
  }
}
declare global {
  interface StencilElementInterfaces {
    'ProgressRing': Components.ProgressRing;
  }

  interface StencilIntrinsicElements {
    'progress-ring': Components.ProgressRingAttributes;
  }
  interface HTMLProgressRingElement extends Components.ProgressRing, HTMLStencilElement {}
  var HTMLProgressRingElement: {
    prototype: HTMLProgressRingElement;
    new (): HTMLProgressRingElement;
  };
  interface HTMLElementTagNameMap {
    'progress-ring': HTMLProgressRingElement
  }
  interface ElementTagNameMap {
    'progress-ring': HTMLProgressRingElement;
  }
}
```

- **Tag name**: `progress-ring`
- **Properties**: `decimalSize (Number)`
- **Attributes**: `decimalSize (Number)`

In addition, the entire content of HTMLElement is copied into the interfaces, so WCA makes sure to filter that out.
