import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { getComponentProp } from "../../helpers/util";

tsTest("jsDoc: Handles visibility modifier on internal event", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		/**
		 * @element
	     */
		class MyElement extends HTMLElement {
			myMethod () {
				/**
				 * @private
				 */
				this.dispatchEvent(new CustomEvent("my-event"));
			}
		}
	 `);

	const {
		events: [event]
	} = result.componentDefinitions[0].declaration!;

	t.truthy(event);
	t.is(event.visibility, "private");
});

tsTest("jsDoc: Handles visibility modifier on constructor assignment", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "test.js",
		text: `
		/**
		 * @element
	     */
		class MyElement extends HTMLElement {
			constructor () {
				super();
				/**
				 * @protected
			     */
				this.foo = "bar";
			}	
		}
	 `
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	const member = getComponentProp(members, "foo");

	t.truthy(member);
	t.is(member!.visibility, "protected");
});
