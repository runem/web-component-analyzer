import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("jsdoc: Discovers custom events with @fires", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
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

tsTest("jsdoc: Discovers the detail type of custom events with @fires", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
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

tsTest("jsdoc: Discovers events declared with @fires that includes extra jsdoc information", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 * @fires InputSwitch#[CustomEvent]input-switch-check-changed Fires when check property changes
	 */
	 class MyElement extends HTMLElement {
	 }
	 `);

	const { events } = result.componentDefinitions[0].declaration();

	t.is(events.length, 1);
	t.is(events[0].name, "input-switch-check-changed");
	t.is(events[0].jsDoc?.description, "Fires when check property changes");
	t.truthy(isAssignableToSimpleTypeKind(events[0].type() as SimpleType, SimpleTypeKind.ANY));
});
