import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers custom elements with @element", t => {
	const { result } = analyzeText(`
	/**
	 * @element my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "my-element");
});

test("jsdoc: Discovers custom elements with @element but without tag name", t => {
	const { result } = analyzeText(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "");
});
