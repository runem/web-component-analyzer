/**
 * @attr {Boolean} disabled - Disables this element
 * @event change - Dispatched when this element changes
 * @slot - Default content placed in the body of this element
 * @slot header - Content placed in the header of this element
 */
export class MyCustomElement extends HTMLElement {
	static get observedAttributes() {
		return ["my-attr"];
	}

	value = 10;

	/**
	 * Size of the button
	 * @attr
	 * @type {"small"|"large"}
	 */
	size = "large";
}

customElements.define("my-element", MyCustomElement);
