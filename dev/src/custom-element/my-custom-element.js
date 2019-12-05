/**
 * @attr {Boolean} disabled - Disables this element
 * @fires change - Dispatched when this element changes
 * @slot - Default content placed in the body of this element
 * @slot header - Content placed in the header of this element
 * @cssprop {Color}  --my-element-color - Controls the color of this element
 * @cssprop {Length}  --my-element-font-size - Controls the font-size in this element
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

	/**
	 * @param {LolBol} [param1=superduper] Description
	 * Multiline description
	 * @returns {Validator[]}
	 */
	doSomething(param1) {
		this.dispatchEvent(new CustomEvent("my-event"));
	}
}

customElements.define("my-element", MyCustomElement);
