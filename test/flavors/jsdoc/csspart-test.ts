import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers css parts with @csspart", t => {
	const { result } = analyzeText(`
	/**
	 * @element
	 * @csspart thumb - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssParts } = result.componentDefinitions[0].declaration();

	t.is(cssParts.length, 1);
	t.is(cssParts[0].name, "thumb");
	t.is(cssParts[0].jsDoc?.description, "This is a comment");
});
