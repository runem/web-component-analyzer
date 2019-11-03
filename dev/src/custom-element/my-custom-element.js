/**
 * @attr {Boolean} disabled - Disables this element
 * @fires change - Dispatched when this element changes
 * @slot - Default content placed in the body of this element
 * @slot header - Content placed in the header of this element
 * @cssprop --my-element-color - Controls the color of this element
 */
export class MyCustomElement extends HTMLElement {
	/**
	 * Size of the element
	 * @attr
	 * @type {"small"|"large"}
	 */
	size = "large";

	constructor() {
		super();
		this.foo = "bar";
	}

	static get observedAttributes() {
		return ["my-attr"];
	}

	doSomething() {
		this.dispatchEvent(new CustomEvent("my-event"));
	}
}

customElements.define("my-element", MyCustomElement);
