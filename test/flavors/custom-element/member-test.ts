import { SimpleType, isAssignableToType, toSimpleType } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { getComponentProp } from "../../helpers/util";

const optional = (type: SimpleType): SimpleType => {
	return { kind: "UNION", types: [{ kind: "UNDEFINED" }, type] };
};

tsTest("Member types can be retrieved", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
				class SomeElement extends HTMLElement {
					prop: number = 123;
				}

				declare global {
					interface HTMLElementTagNameMap {
						"some-element": SomeElement;
					}
				}
			`
		}
	]);

	const { members = [] } = result.componentDefinitions[0]?.declaration ?? {};

	t.is(1, members.length);
	const type = getComponentProp(members, "prop")!.type!();
	t.truthy(isAssignableToType({ kind: "NUMBER" }, toSimpleType(type, checker)));
});

tsTest("Property declaration member types are specialized", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
				class GenericPropElement<T> extends HTMLElement {
					prop?: T;
				}

				class NumberPropElement extends GenericPropElement<number> {}

				class BooleanPropElement extends GenericPropElement<boolean> {}

				declare global {
					interface HTMLElementTagNameMap {
						"number-prop-element": NumberPropElement;
						"boolean-prop-element": BooleanPropElement;
					}
				}
			`
		}
	]);

	const numberElementDecl = result.componentDefinitions.find(x => x.tagName === "number-prop-element")!.declaration!;
	const numberElementPropType = getComponentProp(numberElementDecl.members, "prop")!.type!(numberElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "NUMBER" }), toSimpleType(numberElementPropType, checker)));

	const booleanElementDecl = result.componentDefinitions.find(x => x.tagName === "boolean-prop-element")!.declaration!;
	const booleanElementPropType = getComponentProp(booleanElementDecl.members, "prop")!.type!(booleanElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "BOOLEAN" }), toSimpleType(booleanElementPropType, checker)));
});

tsTest("Getter member types are specialized", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
				class GenericPropElement<T> extends HTMLElement {
					storage?: T;

					get prop(): T | undefined {
						return this.storage;
					}
				}

				class NumberPropElement extends GenericPropElement<number> {}

				class BooleanPropElement extends GenericPropElement<boolean> {}

				declare global {
					interface HTMLElementTagNameMap {
						"number-prop-element": NumberPropElement;
						"boolean-prop-element": BooleanPropElement;
					}
				}
			`
		}
	]);

	const numberElementDecl = result.componentDefinitions.find(x => x.tagName === "number-prop-element")!.declaration!;
	const numberElementPropType = getComponentProp(numberElementDecl.members, "prop")!.type!(numberElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "NUMBER" }), toSimpleType(numberElementPropType, checker)));

	const booleanElementDecl = result.componentDefinitions.find(x => x.tagName === "boolean-prop-element")!.declaration!;
	const booleanElementPropType = getComponentProp(booleanElementDecl.members, "prop")!.type!(booleanElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "BOOLEAN" }), toSimpleType(booleanElementPropType, checker)));
});

tsTest("Setter member types are specialized", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule([
		{
			fileName: "main.ts",
			text: `
				class GenericPropElement<T> extends HTMLElement {
					storage?: T;

					set prop(value: T) {
						this.storage = value;
					}
				}

				class NumberPropElement extends GenericPropElement<number> {}

				class BooleanPropElement extends GenericPropElement<boolean> {}

				declare global {
					interface HTMLElementTagNameMap {
						"number-prop-element": NumberPropElement;
						"boolean-prop-element": BooleanPropElement;
					}
				}
			`
		}
	]);

	const numberElementDecl = result.componentDefinitions.find(x => x.tagName === "number-prop-element")!.declaration!;
	const numberElementPropType = getComponentProp(numberElementDecl.members, "prop")!.type!(numberElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "NUMBER" }), toSimpleType(numberElementPropType, checker)));

	const booleanElementDecl = result.componentDefinitions.find(x => x.tagName === "boolean-prop-element")!.declaration!;
	const booleanElementPropType = getComponentProp(booleanElementDecl.members, "prop")!.type!(booleanElementDecl);
	t.truthy(isAssignableToType(optional({ kind: "BOOLEAN" }), toSimpleType(booleanElementPropType, checker)));
});

tsTest("Constructor declaration member types are specialized", t => {
	const analyzeResult = analyzeTextWithCurrentTsModule([
		// tsc only allows JS to implicitly define members using assignment in the
		// constructor. In TS, `prop` would require a declaration on the class
		// itself (i.e. `prop: T;`).
		{
			fileName: "GenericPropElement.js",
			text: `
				/**
				 * @template T
				 */
				export class GenericPropElement extends HTMLElement {
					/**
					 * @param {T} value
					 */
					constructor(value) {
						super();
						this.prop = value;
					}
				}
			`
		},
		{
			fileName: "main.ts",
			text: `
				import {GenericPropElement} from "./GenericPropElement";

				class NumberPropElement extends GenericPropElement<number> {
					constructor() {
						super(123);
					}
				}

				class BooleanPropElement extends GenericPropElement<boolean> {
					constructor() {
						super(false);
					}
				}

				declare global {
					interface HTMLElementTagNameMap {
						"number-prop-element": NumberPropElement;
						"boolean-prop-element": BooleanPropElement;
					}
				}
			`
		}
	]);
	const { results, checker } = analyzeResult;
	const result = results.find(x => x.sourceFile.fileName === "main.ts")!;

	const numberElementDecl = result.componentDefinitions.find(x => x.tagName === "number-prop-element")!.declaration!;
	const numberElementPropType = getComponentProp(numberElementDecl.members, "prop")!.type!(numberElementDecl);
	t.truthy(isAssignableToType({ kind: "NUMBER" }, toSimpleType(numberElementPropType, checker)));

	const booleanElementDecl = result.componentDefinitions.find(x => x.tagName === "boolean-prop-element")!.declaration!;
	const booleanElementPropType = getComponentProp(booleanElementDecl.members, "prop")!.type!(booleanElementDecl);
	t.truthy(isAssignableToType({ kind: "BOOLEAN" }, toSimpleType(booleanElementPropType, checker)));
});
