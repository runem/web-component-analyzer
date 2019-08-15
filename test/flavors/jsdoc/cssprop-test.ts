import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";

test("jsdoc: Discovers css properties with @cssprop", t => {
	const { result } = analyzeComponentsInCode(`
	/**
	 * @element
	 * @cssprop --this-is-a-css-prop  - Here is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssProperties } = result.componentDefinitions[0].declaration;

	t.is(cssProperties.length, 1);
	t.is(cssProperties[0].name, "--this-is-a-css-prop");
	t.is(cssProperties[0].jsDoc!.comment, "Here is a comment");
});

test("jsdoc: Discovers css properties with @cssproperty", t => {
	const { result } = analyzeComponentsInCode(`
	/**
	 * @element
	 * @cssproperty --this-is-a-css-prop  - Here is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssProperties } = result.componentDefinitions[0].declaration;

	t.is(cssProperties.length, 1);
	t.is(cssProperties[0].name, "--this-is-a-css-prop");
	t.is(cssProperties[0].jsDoc!.comment, "Here is a comment");
});
