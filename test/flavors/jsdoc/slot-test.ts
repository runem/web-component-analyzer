import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers slots with @slots", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @slot myslot - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { slots } = result.componentDefinitions[0].declaration();

	t.is(slots.length, 1);
	t.is(slots[0].name, "myslot");
	t.is(slots[0].jsDoc?.description, "This is a comment");
});

test("jsdoc: Discovers unnamed slots with @slots", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @slot - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { slots } = result.componentDefinitions[0].declaration();

	t.is(slots.length, 1);
	t.log(slots[0]);
	t.is(slots[0].name, undefined);
	t.is(slots[0].jsDoc?.description, "This is a comment");
});

test("jsdoc: Discovers permitted tag names on @slot", t => {
	const {
		results: [result]
	} = analyzeText(`
	/**
	 * @element
	 * @slot {"div"|"span"} myslot1
	 * @slot {"li"} myslot2
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const {
		slots: [slot1, slot2]
	} = result.componentDefinitions[0].declaration();

	t.is(slot1.permittedTagNames!.length, 2);
	t.deepEqual(slot1.permittedTagNames, ["div", "span"]);

	t.is(slot2.permittedTagNames!.length, 1);
	t.deepEqual(slot2.permittedTagNames, ["li"]);
});
