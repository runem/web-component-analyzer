import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Discovers elements defined JSX.IntrinsicElements", t => {
	const {
		results: [result],
		checker
	} = analyzeText({
		fileName: "test.d.ts",
		text: `
	declare namespace JSX {
	  interface IntrinsicElements {
		"my-element": { bar?: boolean }
	  }
	}
	 `
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");

	const { members } = componentDefinitions[0].declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "bar",
				attrName: undefined,
				jsDoc: undefined,
				type: () => ({ kind: SimpleTypeKind.BOOLEAN }),
				reflect: undefined,
				deprecated: undefined,
				required: undefined,
				typeHint: undefined
			}
		],
		t,
		checker
	);
});
