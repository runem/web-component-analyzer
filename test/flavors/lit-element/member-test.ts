import { SimpleTypeKind } from "ts-simple-type";
import { tsTest } from "../../helpers/ts-test";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { assertHasMembers } from "../../helpers/util";

tsTest("litElement: Discovers properties from 'static get properties'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	    static get properties () {
	        return {
	            /**
	             * This is a comment
	             * @default    hello 123
	             * @type {String}
	             */
	            myProp: {type: String}
	        }
	    }
	 }
	 `);

	const { members } = result.componentDefinitions[0]?.declaration();

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				attrName: "myProp",
				jsDoc: {
					description: "This is a comment"
				},
				default: "hello 123",
				typeHint: "String",
				type: () => ({ kind: SimpleTypeKind.STRING }),
				visibility: undefined,
				reflect: "to-property",
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
});
