import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers css properties with @cssprop", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @cssprop --this-is-a-css-prop  - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssProperties } = result.componentDefinitions[0].declaration();

	t.is(cssProperties.length, 1);
	t.is(cssProperties[0].name, "--this-is-a-css-prop");
	t.is(cssProperties[0].jsDoc!.description, "This is a comment");
});

test("jsdoc: Discovers css properties with @cssproperty", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @cssproperty --this-is-a-css-prop  - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssProperties } = result.componentDefinitions[0].declaration();

	t.is(cssProperties.length, 1);
	t.is(cssProperties[0].name, "--this-is-a-css-prop");
	t.is(cssProperties[0].jsDoc?.description, "This is a comment");
});

test("jsdoc: Discovers css properties with @cssproperty and default", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @cssproperty [--element-color=red] - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssProperties } = result.componentDefinitions[0].declaration();

	t.is(cssProperties.length, 1);
	t.is(cssProperties[0].name, "--element-color");
	t.is(cssProperties[0].default, "red");
	t.is(cssProperties[0].jsDoc?.description, "This is a comment");
});
