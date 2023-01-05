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
