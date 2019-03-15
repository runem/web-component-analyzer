import { customElement, LitElement } from "lit-element";

@customElement("my-element")
export class MyElement extends LitElement {
	@property() myBoolean = true;

	myString = "hello";

	myProp = "hejsa";

	static get properties() {
		return {
			myNumber: {
				type: Number
			}
		};
	}
}
