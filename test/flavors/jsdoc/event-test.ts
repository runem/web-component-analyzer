import { isAssignableToSimpleTypeKind, SimpleType } from "ts-simple-type";
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

	const { events } = result.componentDefinitions[0].declaration!;

	t.is(events.length, 1);
	t.is(events[0].name, "my-event");
	t.is(events[0].jsDoc?.description, "This is a comment");
	t.truthy(isAssignableToSimpleTypeKind(events[0].type() as SimpleType, "ANY"));
});

tsTest.only("jsdoc: Discovers the detail type of custom events with @fires", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 * @fires {string} my-event
	 * @fires my-second-event {number}
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { events } = result.componentDefinitions[0].declaration!;
	const myEvent = events.find(e => e.name === "my-event")!;
	const mySecondEvent = events.find(e => e.name === "my-second-event")!;
	t.truthy(isAssignableToSimpleTypeKind(myEvent.type() as SimpleType, "STRING"));
	t.truthy(isAssignableToSimpleTypeKind(mySecondEvent.type() as SimpleType, "NUMBER"));
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

	const { events } = result.componentDefinitions[0].declaration!;

	t.is(events.length, 1);
	t.is(events[0].name, "input-switch-check-changed");
	t.is(events[0].jsDoc?.description, "Fires when check property changes");
	t.truthy(isAssignableToSimpleTypeKind(events[0].type() as SimpleType, "ANY"));
});
