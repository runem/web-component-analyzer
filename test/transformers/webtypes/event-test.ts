import { tsTest } from "../../helpers/ts-test";
import { findHtmlElementOfName, runAndParseWebtypesBuild } from "../../helpers/webtypes-test-utils";

tsTest("Transformer: Webtypes: Element events test", t => {
	const res = runAndParseWebtypesBuild(`
	/**
	 * @fires test-event - Test event desc
	 * @fires test-event2 {CustomEvent<{index: int, name: string}>} - Test event desc with typing
	 */
	@customElement('my-element')
	class MyElement extends HTMLElement {}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);

	const events = myElement?.js?.events;
	t.truthy(events);
	t.is(events?.length, 2);

	const testEvent = events?.find(cp => cp.name == "test-event");
	t.truthy(testEvent);
	t.is(testEvent?.description, "Test event desc");

	const testEvent2 = events?.find(cp => cp.name == "test-event2");
	t.truthy(testEvent2);
	t.is(testEvent2?.description, "Test event desc with typing");
	// typing value not put in event
});
