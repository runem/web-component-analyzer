export class MySuperSuperClass extends HTMLElement {
	/**
	 * My description
	 */
	myProp: string = "hehe";
}

export class MySuperClass extends MySuperSuperClass {
	/**
	 * This is a description
	 */
	myProp: string = "hehe";
}

/**
 * This is a custom element
 * @fires my-custom-event - I'm an event!
 * @csspart mypart - Hello
 * @example <h1>Hello</h1>
 */
export class CustomElement extends MySuperClass {
	myProp = "hello";

	static get observedAttributes() {
		return ["attr1", "attr2"];
	}

	set attr1(val: string) {}

	onClick() {
		this.dispatchEvent(new CustomEvent("my-custom-event", { detail: "hello" }));
		this.dispatchEvent(new MouseEvent("mouse-move"));
	}
}

customElements.define("my-element", CustomElement);
