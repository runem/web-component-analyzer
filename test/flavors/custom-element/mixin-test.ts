import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers, getAttributeNames, getComponentProp, getPropertyNames } from "../../helpers/util";

tsTest("Handles circular inheritance", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class MyElement extends MyElement {
		}
		
		/**
		 * @element
		 */
		class MyElement extends MyElement {
			static get observedAttributes() {
				return ["a", "b"];
			}
		}
	 `);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b"]);
});

tsTest("Handles circular inheritance using mixins", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		const Mixin1 = (Base) => {
			return class Mixin1 extends Mixin2(Base) {}
		}
		
		const Mixin2 = (Base) => {
			return class Mixin2 extends Mixin1(Base) {}
		}
		
		/**
		 * @element
		 */
		class MyElement extends Mixin1(Mixin2(HTMLElement)) {
			static get observedAttributes() {
				return ["a", "b"];
			}
		}
	 `);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b"]);
});

tsTest("Handles mixin with variable declaration in TS declaration file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.js",
			text: `
		import { Mixin1 } from "./mixins";
		/**
		 * @element
		 */
		class MyElement extends Mixin1(HTMLElement) {
			c: number;
		}	
		`
		},
		{
			fileName: "mixins.d.ts",
			text: `
	declare type Constructor<T = object> = new (...args: any[]) => T;
	export interface MyInterface {
		a: number;
	}

	export declare abstract class MyClass {
		b: number;
	}
	
	export declare const Mixin1: <T extends Constructor<MyInterface & MyClass>>(base: T) => Constructor<MyClass & MyInterface> & T;

		
		`,
			analyze: false
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "a"
			},
			{
				kind: "property",
				propName: "b"
			},
			{
				kind: "property",
				propName: "c"
			}
		],
		t
	);
});

tsTest("Handles simple mixin", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b", "c", "d"]);
});

tsTest("Handles mixin with local variable subclass", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		const ExtraMixin = (Base) => {
			return class ExtraMixinClass extends Base {
				static get observedAttributes() {
					return ["d", ...super.observedAttributes];
				}
			}
		}
		
		const MyMixin = (base) => {
            const Base = ExtraMixin(base);

            class MixinClass extends Base {
				static get observedAttributes() {
					return ["c", ...super.observedAttributes];
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b", "c", "d"]);
});

tsTest("Handles 2 levels of mixins", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "c", "d"]);
});

tsTest("Handles mixins with properties", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(members.length, 2);
	t.truthy(getComponentProp(members, "elementProperty"));
	t.truthy(getComponentProp(members, "mixinProperty"));
});

tsTest("Handles mixins generated with factory functions", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		export const FieldCustomMixin = dedupeMixin(superclass =>
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};
	const attributeNames = getAttributeNames(members);

	t.deepEqual(attributeNames, ["a", "b", "c", "d"]);
});

tsTest("Handles nested mixin extends", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		const MyMixin1 = (Base) => {
			return class Mixin1 extends Base {
				static get observedAttributes() {
					return ["c", ...super.observedAttributes];
				}
			}
		}
		
		const MyMixin2 = (Base) => {
			return class Mixin2 extends Base {
				static get observedAttributes() {
					return ["b", ...super.observedAttributes];
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

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};
	const attributeNames = getAttributeNames(members);
	t.deepEqual(attributeNames, ["a", "b", "c"]);
});

tsTest("Handles nested mixin wrapper functions", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`

	/* =============== Mixin 1 ===================== */
	export function AtFormItemMixin<A>(base: A) {
		abstract class AtFormItemMixinImplementation extends base {
			f = "f";
		}
	}

	/* =============== Mixin 2 ===================== */
	function __AtInputOrTextareaFormItemMixin<A>(base: A) {
		abstract class AtInputOrTextareaFormItemMixinImplementation extends base {
			e = "e";
		}
	}

	function AtInputOrTextareaFormItemMixin<A>(base: A) {
		return __AtInputOrTextareaFormItemMixin(AtFormItemMixin(base));
	}

	/* =============== Mixin 3 ===================== */
	function __AtInputFormItemMixin<A>(base: A) {
		abstract class AtInputFormItemMixinImplementation extends base {
			d = "d";
		}

		return AtInputFormItemMixinImplementation;
	}	

	function AtInputFormItemMixin<A>(base: A) {
		return __AtInputFormItemMixin(AtInputOrTextareaFormItemMixin(base));
	}
	
	/* =============== Mixin 4 ===================== */
	function __AtTextFormItemMixin<A>(base: A) {
		abstract class AtTextFormItemMixinImplementation extends base {
			c = "c";
		}
	}
	
	function AtTextFormItemMixin<A>(base: A) {
		return __AtTextFormItemMixin(AtInputFormItemMixin(base));
	}
	
	/* =============== Mixin 5 ===================== */
	function __AtTextFieldFormItemMixin<A>(base: A) {
		class AtTextFieldFormItemMixinImplementation extends base {
			b = "b";
		}
	}
	
	function AtTextFieldFormItemMixin<A>(base: A) {
		return __AtTextFieldFormItemMixin(AtTextFormItemMixin(base));
	}
	
	/* =============== Element =====================0 */
	class AtFormField extends AtFormFieldMixin(HTMLElement) {
		g = "g";
	}
	
	export class AtTextField extends AtTextFieldFormItemMixin(AtFormField) {
		a = "a";
	}
	
	customElements.define("at-text-field", AtTextField);
	 `);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const propertyNames = getPropertyNames(members);
	t.deepEqual(propertyNames, ["a", "b", "c", "d", "e", "f", "g"]);
});

tsTest("Handles types in declaration files that represents a component with mixins", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "element.d.ts",
		text: `
		import { LitElement } from "lit-element";
import { TemplateResult } from "lit-html";
declare const AtButton_base: {
    new (...args: any[]): import("lit-element").LitElement & {
        color: "review" | "create" | "act" | "grow" | "rate" | "done" | "error" | "primary" | "accent" | "warn" | "white" | "black" | "success" | "shady" | undefined;
        size: "small" | "medium" | "large" | undefined;
        updateTabIndex(): void;
    };
    readonly styles: import("lit-element").CSSResultArray;
} & {
    new (...args: any[]): import("lit-element").LitElement & {
        fab: boolean;
        flat: boolean;
        $formItem: HTMLInputElement | HTMLSelectElement | HTMLButtonElement | HTMLOutputElement | HTMLTextAreaElement | undefined;
    };
    readonly styles: import("lit-element").CSSResultArray;
} & {
    new (...args: any[]): import("lit-element").LitElement & {
        min: number | undefined;
        max: number | undefined;
    };
    readonly styles: import("lit-element").CSSResultArray;
} & typeof LitElement;

export declare class AtButton extends AtButton_base { }

declare global {
    interface HTMLElementTagNameMap {
        "at-button": AtButton;
    }
}
	 `
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const propNames = getPropertyNames(members);

	t.deepEqual(propNames, ["color", "size", "fab", "flat", "$formItem", "min", "max"]);
});
