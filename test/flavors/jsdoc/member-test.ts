import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

tsTest("jsdoc: Discovers properties with @prop", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 * @prop {String} [prop1=def] - This is a comment
	 * @attr {MySuperType} attr1
	 * @prop {number} size
	 * @attr [size=123]
	 * @prop {MyType} this is a prop with no name
	 */
	 class MyElement extends HTMLElement { 
	 }
	 `);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "prop1",
				attrName: undefined,
				jsDoc: {
					description: "This is a comment"
				},
				default: "def",
				typeHint: "String",
				type: () => ({ kind: "ANY" }),
				visibility: undefined,
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "attribute",
				propName: undefined,
				attrName: "attr1",
				jsDoc: undefined,
				default: undefined,
				typeHint: "MySuperType",
				type: () => ({ kind: "STRING" }),
				visibility: undefined,
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "size",
				attrName: "size",
				jsDoc: undefined,
				default: 123,
				typeHint: "number",
				type: () => ({ kind: "NUMBER" }),
				visibility: undefined,
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
});

tsTest("jsdoc: Discovers attributes defined on getters with @attr", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
		/**
		 * This is a comment
		 * @attr {boolean} [auto-reload=false]
		 */
		get autoReload() {
			return this.hasAttribute('auto-reload');
		}
	 }
	 `);

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "autoReload",
				attrName: "auto-reload",
				jsDoc: {
					description: "This is a comment"
				},
				default: false,
				typeHint: "boolean",
				type: () => ({ kind: "BOOLEAN" }),
				visibility: "public",
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
});
