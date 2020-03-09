import { customElement, LitElement, property } from "lit-element";

type Color = "blue" | "red";

/**
 * This is my element
 * @fires {string} change - This is a change event
 * @fires my-event - This event is awesome
 * @cssprop {Color} --main-bg-color - This css property is nice!
 * @cssprop --main-color - This css property is also nice!
 * @attr {on|off} switch - This is a great attribute
 * @attr {String} my-attr - This is an attribute defined from jsdoc
 * @prop {String} my-prop - This is a property defined from jsdoc
 * @slot {'li'} - Content is placed between the named slots if provided without a slot.
 * @slot {"div"|"span"} start - Content is placed to the left of the button text in LTR, and to the right in RTL.
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
	@property() myDate = new Date();
	/**
	 * This is a great property!
	 */
	@property() myProp1?: { hej: string; rune: string } = { hej: "string", rune: "hello" };

	@property() hello = false;

	@property() myProp5: Color = "red";

	static get properties() {
		return {
			/**
			 * This is a comment
			 * @type {red|green}
			 * @private
			 */
			myProp1: {
				type: Object
			}
		};
	}

	static get observedAttributes() {
		return ["attr1", "attr2"];
	}

	render() {}

	@property({ type: String }) set value(str: string) {}
}
