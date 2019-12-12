import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("jsDoc: Handles @readonly on members", t => {
	const {
		results: [result],
		checker
	} = analyzeText(`
		/**
		 * @element
	     */
		class MyElement extends HTMLElement {
			/**
			 * @readonly
			 */
			myProp = "foo";
		}
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				modifiers: new Set(["readonly"]),
				type: () => ({ kind: SimpleTypeKind.STRING })
			}
		],
		t,
		checker
	);
});
