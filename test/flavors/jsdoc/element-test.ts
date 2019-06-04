import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";

test("jsdoc: Discovers custom elements with @element", t => {
	const [result] = analyzeComponentsInCode(`
	/**
	 * @element my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.result.componentDefinitions.length, 1);
	t.is(result.result.componentDefinitions[0].tagName, "my-element");

	t.pass();
});

test("jsdoc: Discovers custom elements with @customElement", t => {
	const [result] = analyzeComponentsInCode(`
	/**
	 * @customElement my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.result.componentDefinitions.length, 1);
	t.is(result.result.componentDefinitions[0].tagName, "my-element");

	t.pass();
});
