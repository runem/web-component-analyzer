import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getComponentProp } from "../../helpers/util";

test("jsDoc: Handles visibility modifier on internal event", t => {
	const { result } = analyzeComponentsInCode(`
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
	} = result.componentDefinitions[0]?.declaration();

	t.truthy(event);
	t.is(event.visibility, "private");
});

test("jsDoc: Handles visibility modifier on constructor assignment", t => {
	const { result } = analyzeComponentsInCode(
		`
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
	 `,
		"js"
	);

	const { members } = result.componentDefinitions[0]?.declaration();

	const member = getComponentProp(members, "foo");

	t.truthy(member);
	t.is(member!.visibility, "protected");
});
