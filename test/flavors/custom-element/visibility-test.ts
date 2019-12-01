import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Handle Typescript visibility modifiers", t => {
	const {
		results: [result],
		checker
	} = analyzeText(`
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

test("Handle visibility for private '_' prefixed names", t => {
	const {
		results: [result],
		checker
	} = analyzeText(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		_myProp = 123;
		_myMethod () {
		}
	}
`);

	const {
		members,
		methods: [method]
	} = result.componentDefinitions[0]?.declaration();

	t.is(method.name, "_myMethod");
	t.is(method.visibility, "private");

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "_myProp",
				visibility: "private"
			}
		],
		t,
		checker
	);
});
