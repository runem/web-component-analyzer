import { customElement, LitElement, property } from "lit-element";

/**
 * This is my element
 * @event change - This event is awesome
 * @cssprop --main-bg-color - This css property is nice!
 * @cssprop --main-color - This css property is also nice!
 * @attr {on|off} switch - This is a great attribute
 * @attr {String} my-attr - This is an attribute defined from jsdoc
 * @prop {String} my-prop - This is a property defined from jsdoc
 * @slot - Content is placed between the named slots if provided without a slot.
 * @slot start - Content is placed to the left of the button text in LTR, and to the right in RTL.
 * @slot end - Content is placed to the right of the button text in LTR, and to the left in RTL.
 */
@customElement("my-lit-element")
export class MyElement extends LitElement {
	/**
	 * This is my prop
	 * @deprecated
	 * @attr
	 */
	myProp2 = "hello";
	@property({ attribute: "my-attr3" }) myProp3 = 12;
	@property({ attribute: false }) myProp4 = 12;
	/**
	 * This is a great property!
	 */
	@property() myProp1?: { hej: string; rune: string } = { hej: "string", rune: "hello" };

	@property() hello = false;

	static get properties() {
		return {
			myProp1: {
				type: Object
			}
		};
	}

	static get observedAttributes() {
		return ["attr1", "attr2"];
	}

	@property({ type: String }) set value(str: string) {}
}
