/**
 * @fires my-custom-event - Im event!
 * @csspart mypart - Hello
 */
export class CustomElement extends HTMLElement {
	myProp = "hello";

	static get observedAttributes() {
		return ["attr1", "attr2"];
	}

	set attr1(val: string) {}

	onClick() {
		new CustomEvent("my-custom-event");
	}
}

customElements.define("my-element", CustomElement);
