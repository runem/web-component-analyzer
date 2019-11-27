import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getAttributeNames, getComponentProp, getPropertyNames } from "../../helpers/util";

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
		
		customElements.define("my-element", MyElement);
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b", "c", "d"]);
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
		
		customElements.define("my-element", MyElement);
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "c", "d"]);
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

	const { members } = result.componentDefinitions[0]?.declaration();

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

	const { members } = result.componentDefinitions[0]?.declaration();
	const attributeNames = getAttributeNames(members);
	t.deepEqual(attributeNames, ["a", "b", "c", "d"]);
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
		
		customElements.define("my-element", MyElement);
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();
	const attributeNames = getAttributeNames(members);
	t.deepEqual(attributeNames, ["a", "c", "d"]);
});

test("Handles nested mixin wrapper functions", t => {
	const { result } = analyzeComponentsInCode(`

	/* =============== Mixin 1 ===================== */
	export function AtFormItemMixin<A>(base: A) {
		abstract class AtFormItemMixinImplementation extends base {
			a = "a";
		}
	}

	/* =============== Mixin 2 ===================== */
	function __AtInputOrTextareaFormItemMixin<A>(base: A) {
		abstract class AtInputOrTextareaFormItemMixinImplementation extends base {
			b = "b";
		}
	}

	function AtInputOrTextareaFormItemMixin<A>(base: A) {
		return __AtInputOrTextareaFormItemMixin(AtFormItemMixin(base));
	}

	/* =============== Mixin 3 ===================== */
	function __AtInputFormItemMixin<A>(base: A) {
		abstract class AtInputFormItemMixinImplementation extends base {
			c = "c";
		}

		return AtInputFormItemMixinImplementation;
	}	

	function AtInputFormItemMixin<A>(base: A) {
		return __AtInputFormItemMixin(AtInputOrTextareaFormItemMixin(base));
	}
	
	/* =============== Mixin 4 ===================== */
	function __AtTextFormItemMixin<A>(base: A) {
		abstract class AtTextFormItemMixinImplementation extends base {
			d = "d";
		}
	}
	
	function AtTextFormItemMixin<A>(base: A) {
		return __AtTextFormItemMixin(AtInputFormItemMixin(base));
	}
	
	/* =============== Mixin 5 ===================== */
	function __AtTextFieldFormItemMixin<A>(base: A) {
		class AtTextFieldFormItemMixinImplementation extends base {
			e = "e";
		}
	}
	
	function AtTextFieldFormItemMixin<A>(base: A) {
		return __AtTextFieldFormItemMixin(AtTextFormItemMixin(base));
	}
	
	/* =============== Element =====================0 */
	class AtFormField extends AtFormFieldMixin(HTMLElement) {
		f = "f";
	}
	
	export class AtTextField extends AtTextFieldFormItemMixin(AtFormField) {
		g = "g";
	}
	
	customElements.define("at-text-field", AtTextField);
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();

	const propertyNames = getPropertyNames(members);
	t.deepEqual(propertyNames, ["g", "f", "e", "d", "c", "b", "a"]);
});
