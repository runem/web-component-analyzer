import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

import { CustomElementFlavor } from "../../../src/analyze/flavors/custom-element/custom-element-flavor";
import { JsDocFlavor } from "../../../src/analyze/flavors/js-doc/js-doc-flavor";
import { LwcFlavor } from "../../../src/analyze/flavors/lwc/lwc-flavor";

// To run the test:
//    yarn ava --ext ts test/flavors/lwc/member-test.ts

tsTest("LWC: Discovers properties from '@api'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	 class MyElement extends LightningElement { 
	    /**
	     * This is a comment
	     */
	    @api myProp = "hello";
	    
	    @api myProp2 = 123;
	    
	    @api get myProp3() {};
	    
		myProp4 = "not public";
	    
		myProp5;

		get myProp6() {};

		@api accessKey;

		@api get htmlFor() {};

		@api Upper;

		noValidate;
		
		@api m() {}
		
		m() {}
	 }
	 `, {
		flavors: [new LwcFlavor(), new CustomElementFlavor(), new JsDocFlavor()]
	 });

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				attrName: "my-prop",
				jsDoc: {
					description: "This is a comment"
				},
				default: "hello",
				type: () => ({ kind: "STRING" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined,
			 },
			{
				kind: "property",
				propName: "myProp2",
				attrName: "my-prop2",
				default: 123,
				type: () => ({ kind: "NUMBER" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "myProp3",
				attrName: "my-prop3",
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "myProp4",
				attrName: undefined,
				default: "not public",
				type: () => ({ kind: "ANY" }),
				visibility: "protected",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "myProp5",
				attrName: undefined,
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "protected",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "myProp6",
				attrName: undefined,
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "protected",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "accessKey",
				attrName: "accesskey",
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "htmlFor",
				attrName: "for",
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "Upper",
				attrName: "-upper",
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "public",
				deprecated: undefined,
				required: undefined
			},
			{
				kind: "property",
				propName: "noValidate",
				attrName: undefined,
				default: undefined,
				type: () => ({ kind: "ANY" }),
				visibility: "protected",
				deprecated: undefined,
				required: undefined
			},
		],
		t,
		checker
	);
});
