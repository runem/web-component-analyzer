import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("Correctly finds method declarations on a class", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		myMethod () {
		}
	}
	`);

	const { methods } = result.componentDefinitions[0]?.declaration();

	t.is(methods.length, 1);
	t.is(methods[0].name, "myMethod");
});

test("Doesn't pick up method declarations not on class declaration", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		myMethod () {
			lib.init({
			  fooMethod() {
			  }
			})
		}
	}
	`);

	const { methods } = result.componentDefinitions[0]?.declaration();

	t.is(methods.length, 1);
	t.is(methods[0].name, "myMethod");
});
