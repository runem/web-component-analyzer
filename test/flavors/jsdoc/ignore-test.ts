import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("jsDoc: Handles @ignore jsdoc tag", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		/**
		 * @element
	     */
		class MyElement extends HTMLElement {
		    /**
		     * @ignore
		     */
			myMethod () {
				/**
				 * @ignore
				 */
				this.dispatchEvent(new CustomEvent("my-event"));
			}
			
			/**
			 * @ignore
			 */
			foo = "bar";
		}
	 `);

	const { events, methods, members } = result.componentDefinitions[0].declaration!;

	t.is(events.length, 0);
	t.is(members.length, 0);
	t.is(methods.length, 0);
});
