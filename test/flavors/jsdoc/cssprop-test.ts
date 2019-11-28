import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers css properties with @cssprop", t => {
	const { result } = analyzeText(`
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
	const { result } = analyzeText(`
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
