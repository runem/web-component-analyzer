import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Handle Typescript visibility modifiers", t => {
	const { result, checker } = analyzeText(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		private myProp1;
		protected myProp2;
	}
`);

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp1",
				visibility: "private"
			},
			{
				kind: "property",
				propName: "myProp2",
				visibility: "protected"
			}
		],
		t,
		checker
	);
});
