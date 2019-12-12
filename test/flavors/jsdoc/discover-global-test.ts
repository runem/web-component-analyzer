import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("jsdoc: Discovers global features on HTMLElement", t => {
	const {
		results: [result]
	} = analyzeText(
		{
			fileName: "test.d.ts",
			text: `
	declare global {
	  /**
	   * @fires my-event
	   * @csspart my-part
	   */
	  interface HTMLElement {
	  }
	}
	 `
		},
		{ config: { analyzeGlobalFeatures: true } }
	);

	const { globalFeatures } = result;

	t.is(globalFeatures?.cssParts[0]?.name, "my-part");
	t.is(globalFeatures?.events[0]?.name, "my-event");
});
