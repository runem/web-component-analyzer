import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Discovers global features on JSX.IntrinsicAttributes", t => {
	const {
		results: [result],
		checker
	} = analyzeText(
		{
			fileName: "test.d.ts",
			text: `
	declare namespace JSX {
	  interface IntrinsicAttributes {
	    /**
	     * @attr
	     */
		bar?: boolean;
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
				propName: "bar",
				attrName: "bar",
				type: () => ({ kind: SimpleTypeKind.BOOLEAN })
			}
		],
		t,
		checker
	);
});
