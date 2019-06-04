import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";

test("jsdoc: Discovers custom elements with @element", t => {
	const [{ result }] = analyzeComponentsInCode(`
	/**
	 * @element my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "my-element");
});

test("jsdoc: Discovers custom elements with @customElement", t => {
	const [{ result }] = analyzeComponentsInCode(`
	/**
	 * @customElement my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "my-element");
});

test("jsdoc: Discovers custom elements with @element but without tag name", t => {
	const [{ result }] = analyzeComponentsInCode(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "");
});
