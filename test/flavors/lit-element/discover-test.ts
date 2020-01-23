import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("LitElement: Discovers elements defined using @customElement decorator", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		@customElement("my-element")	
		class MyElement extends HTMLElement {
		}
	 `);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});
