import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

tsTest("Discovers global members on HTMLElement", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(
		{
			fileName: "test.d.ts",
			text: `
	declare global {
	  /**
	   * @attr anAttr
	   * @prop aProp
	   */
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
				type: () => ({ kind: "STRING" })
			},
			{
				kind: "property",
				propName: "myProp",
				type: () => ({ kind: "BOOLEAN" })
			},
			{
				kind: "property",
				propName: "aProp"
			},
			{
				kind: "attribute",
				attrName: "anAttr"
			}
		],
		t,
		checker
	);
});

tsTest("Discovers global events on HTMLElementEventMap and HTMLElement", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(
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
