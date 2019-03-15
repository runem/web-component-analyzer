export class CustomElement extends HTMLElement {
	myProp = "hello";

	static get observedAttributes() {
		return ["attr1", "attr2"];
	}

	set attr1(val: string) {}
}

customElements.define("my-element", CustomElement);
