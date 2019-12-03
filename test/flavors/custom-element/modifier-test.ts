import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Readonly modifier is found", t => {
	const {
		results: [result],
		checker
	} = analyzeText({
		fileName: "test.js",
		text: `
		/**
		 * @element
		 */
		class MyElement extends HTMLElement {
			readonly myProp: string;
		}
	 `
	});

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				modifiers: new Set(["readonly"])
			}
		],
		t,
		checker
	);
});

test("Getter have readonly modifier", t => {
	const {
		results: [result],
		checker
	} = analyzeText({
		fileName: "test.js",
		text: `
		/**
		 * @element
		 */
		class MyElement extends HTMLElement {
			get myProp() {
				return "foo";
			}
		}
	 `
	});

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				modifiers: new Set(["readonly"])
			}
		],
		t,
		checker
	);
});

test("Getter and setter become one property without readonly modifier", t => {
	const {
		results: [result],
		checker
	} = analyzeText({
		fileName: "test.js",
		text: `
		/**
		 * @element
		 */
		class MyElement extends HTMLElement {
			get myProp() {
				return "foo";
			}
		}
	 `
	});

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				modifiers: new Set(),
				type: () => ({ kind: SimpleTypeKind.STRING })
			}
		],
		t,
		checker
	);
});
