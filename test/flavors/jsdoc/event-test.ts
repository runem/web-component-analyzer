import test from "ava";
import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";

test("jsdoc: Discovers custom events with @fires", t => {
	const { result } = analyzeComponentsInCode(`
	/**
	 * @element
	 * @fires my-event - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { events } = result.componentDefinitions[0].declaration();

	t.is(events.length, 1);
	t.is(events[0].name, "my-event");
	t.is(events[0].jsDoc?.description, "This is a comment");
	t.truthy(isAssignableToSimpleTypeKind(events[0].type() as SimpleType, SimpleTypeKind.ANY));
});

test("jsdoc: Discovers the detail type of custom events with @fires", t => {
	const { result } = analyzeComponentsInCode(`
	/**
	 * @element
	 * @fires {string} my-event
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { events } = result.componentDefinitions[0].declaration();
	t.truthy(isAssignableToSimpleTypeKind(events[0].type() as SimpleType, SimpleTypeKind.STRING));
});
