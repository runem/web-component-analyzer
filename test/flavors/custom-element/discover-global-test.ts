import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Discovers global features on HTMLElement", t => {
	const {
		results: [result],
		checker
	} = analyzeText(
		{
			fileName: "test.d.ts",
			text: `
	declare global {
	  interface HTMLElement {
		"mdc-dialog-action": string;
		"mdc-dialog-initial-focus": boolean;
	  }
	}
	 `
		},
		{ config: { analyzeGlobalFeatures: true } }
	);

	const { globalFeatures } = result;

	assertHasMembers(
		globalFeatures?.members || [],
		[
			{
				kind: "property",
				propName: "mdc-dialog-action",
				type: () => ({ kind: SimpleTypeKind.STRING })
			},
			{
				kind: "property",
				propName: "mdc-dialog-initial-focus",
				type: () => ({ kind: SimpleTypeKind.BOOLEAN })
			}
		],
		t,
		checker
	);
});
