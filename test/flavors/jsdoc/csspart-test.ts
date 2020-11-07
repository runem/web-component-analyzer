import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("jsdoc: Discovers css parts with @csspart", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 * @csspart thumb - This is a comment
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { cssParts } = result.componentDefinitions[0].declaration!;

	t.is(cssParts.length, 1);
	t.is(cssParts[0].name, "thumb");
	t.is(cssParts[0].jsDoc?.description, "This is a comment");
});
