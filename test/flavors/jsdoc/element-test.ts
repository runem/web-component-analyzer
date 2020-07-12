import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("jsdoc: Discovers custom elements with @element", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element my-element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "my-element");
});

tsTest("jsdoc: Discovers custom elements with @element but without tag name", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "");
});

tsTest("jsdoc: Discovers custom elements with multiline @element", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element my-element
	 * \`This is a multiline element\`
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	t.is(result.componentDefinitions.length, 1);
	t.is(result.componentDefinitions[0].tagName, "my-element");
});
