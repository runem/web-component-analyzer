import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("jsdoc: Correctly discovers the description in the jsdoc", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * This CSS makes text in \`<p>\` tags red.
	 * \`\`\`
	 * p { color: red; }
	 * \`\`\`
	 * This is an example
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const declaration = result.componentDefinitions[0].declaration!;

	t.is(
		declaration.jsDoc?.description,
		`This CSS makes text in \`<p>\` tags red.
\`\`\`
p { color: red; }
\`\`\`
This is an example`
	);
});
