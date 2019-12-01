import test from "ava";
import { SimpleTypeKind } from "ts-simple-type";
import { analyzeText } from "../../../src/analyze/analyze-text";
import { assertHasMembers } from "../../helpers/util";

test("jsdoc: Discovers properties with @prop", t => {
	const {
		results: [result],
		checker
	} = analyzeText(`
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

	const { members } = result.componentDefinitions[0]?.declaration();

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
				type: () => ({ kind: SimpleTypeKind.ANY }),
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
				type: () => ({ kind: SimpleTypeKind.STRING }),
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
				default: "123",
				typeHint: "number",
				type: () => ({ kind: SimpleTypeKind.NUMBER }),
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
