import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

tsTest("Discovers elements defined JSX.IntrinsicElements", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
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

	const { members } = componentDefinitions[0].declaration!;

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "bar",
				attrName: undefined,
				jsDoc: undefined,
				type: () => ({ kind: "BOOLEAN" }),
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
