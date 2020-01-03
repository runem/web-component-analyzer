import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("Discovers global members on HTMLElement", t => {
	const {
		results: [result],
		checker
	} = analyzeText(
		{
			fileName: "test.d.ts",
			text: `
	declare global {
	  interface HTMLElement {
		"mdc-dialog-action": string;
		myProp: boolean;
	  }
	}
	 `
		},
		{ config: { analyzeGlobalFeatures: true } }
	);

	const { globalFeatures } = result;

	assertHasMembers(
		globalFeatures?.members || [],
		[
			{
				kind: "property",
				propName: "mdc-dialog-action",
				type: () => ({ kind: SimpleTypeKind.STRING })
			},
			{
				kind: "property",
				propName: "myProp",
				type: () => ({ kind: SimpleTypeKind.BOOLEAN })
			}
		],
		t,
		checker
	);
});

test("Discovers global events on HTMLElementEventMap and HTMLElement", t => {
	const {
		results: [result]
	} = analyzeText(
		{
			fileName: "test.d.ts",
			text: `
	declare global {
	  /**
	   * @fires update
	   */
	  interface HTMLElement {
	  }
	  interface HTMLElementEventMap {
        'change': CustomEvent;
       }
	}
	 `
		},
		{ config: { analyzeGlobalFeatures: true } }
	);

	const { globalFeatures } = result;

	t.is(globalFeatures?.events.length, 2);
	t.is(globalFeatures?.events[0].name, "update");
	t.is(globalFeatures?.events[1].name, "change");
});
