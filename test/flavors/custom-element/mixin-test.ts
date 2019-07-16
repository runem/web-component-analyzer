import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getAttributeNames, getComponentProp } from "../../helpers/util";

test("Handles simple mixin", t => {
	const { result } = analyzeComponentsInCode(`
		const MyMixin = (Base) => {
			return class Mixin extends Base {
				static get observedAttributes() {
					return ["c", "d"];
				}
			}
		}

		class MyElement extends MyMixin(HTMLElement) {
			static get observedAttributes() {
				return ["a", "b", ...super.observedAttributes];
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];
	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["c", "d", "a", "b"]);
});

test("Handles 2 levels of mixins", t => {
	const { result } = analyzeComponentsInCode(`
		const MyMixin1 = (Base) => {
			return class Mixin extends Base {
				static get observedAttributes() {
					return ["d", ...super.observedAttributes];
				}
			}
		}
		
		const MyMixin2 = (Base) => {
			return class Mixin extends MyMixin1(Base) {
				static get observedAttributes() {
					return ["c", ...super.observedAttributes];
				}
			}
		}

		class MyElement extends MyMixin2(HTMLElement) {
			static get observedAttributes() {
				return ["a", ...super.observedAttributes];
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];
	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["d", "c", "a"]);
});

test("Handles mixins with properties", t => {
	const { result } = analyzeComponentsInCode(`
		type Constructor<T = {}> = new (...args: any[]) => T;
		const SomeMixin = <C extends Constructor<HTMLElement>>(Base: C) => {
			class Mixin extends Base {
				@property({ type: String }) mixinProperty: string;
			}
			return Mixin;
		}

		@customElement("some-element")
		class SomeElement extends SomeMixin(LitElement) {
			@property({ type: String }) elementProperty: string;
		}
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];

	t.is(members.length, 2);
	t.truthy(getComponentProp(members, "elementProperty"));
	t.truthy(getComponentProp(members, "mixinProperty"));
});

test("Handles mixins generated with factory functions", t => {
	const { result } = analyzeComponentsInCode(`
		export const FieldCustomMixin = dedupeMixin(
		superclass =>
			class FieldCustomMixin extends superclass {
				static get observedAttributes() { 
					return ["c", "d"]; 
				}
			},
		);

		class SomeElement extends FieldCustomMixin(HTMLElement) {
			static get observedAttributes() { 
				return ["a", "b", ...super.observedAttributes]; 
			}
		}
		
		customElements.define("my-element", SomeElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];
	const attributeNames = getAttributeNames(members);
	t.deepEqual(attributeNames, ["c", "d", "a", "b"]);
});

test("Handles nested mixin extends", t => {
	const { result } = analyzeComponentsInCode(`
		const MyMixin1 = (Base) => {
			return class Mixin extends Base {
				static get observedAttributes() {
					return ["d", ...super.observedAttributes];
				}
			}
		}
		
		const MyMixin2 = (Base) => {
			return class Mixin extends Base {
				static get observedAttributes() {
					return ["c", ...super.observedAttributes];
				}
			}
		}

		class MyElement extends MyMixin2(MyMixin1(HTMLElement)) {
			static get observedAttributes() {
				return ["a", ...super.observedAttributes];
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];
	const attributeNames = getAttributeNames(members);
	t.deepEqual(attributeNames, ["d", "c", "a"]);
});
