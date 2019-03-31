import { customElement, LitElement } from "lit-element";

@customElement("my-element")
export class MyElement extends LitElement {
	@property() myBoolean = true;

	myString = "hello";

	myProp = "hejsa";

	static get properties() {
		return {
			/**
			 * This is a comment
			 * @type {red|green}
			 */
			myColor: {
				type: String
			},
			myNumber: {
				type: Number
			}
		};
	}
}
