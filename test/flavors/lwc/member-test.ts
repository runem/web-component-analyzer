import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

// To run the test:
//    yarn ava --ext ts test/flavors/lwc/member-test.ts

tsTest("LWC: Discovers properties from '@api'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
		import { api, LightningElement } from 'lwc';
		class MyElement extends LightningElement {
			@api
			myProp = "hello 123";
		}
	`
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};
	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				attrName: "my-prop",
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: "STRING" }),
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

tsTest("LWC: doesn't process non-LWC element'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.ts",
		text: `
		// This is defined as an interface to test a regression
		interface MyElement extends HTMLElement {
			myProp: string;
		}
		declare var MyElement: {
			prototype: MyElement;
			new(): MyElement;
		};
		interface HTMLElementTagNameMap {
			'my-element': MyElement,
		}
	`
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};
	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				default: undefined,
				typeHint: undefined,
				type: () => ({ kind: "STRING" }),
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

tsTest("LWC: Discovers properties without @api'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
		import { api, LightningElement } from 'lwc';
		class MyElement extends LightningElement {
			myProp = "hello 123";
		}
	`
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				attrName: undefined,
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: "STRING" }),
				visibility: "protected",
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
	//t.is(members.length, 0);
});

tsTest("LWC: Discovers properties from '@track'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
		import { api, LightningElement } from 'lwc';
		class MyElement extends LightningElement {
			myProp = "hello 123";
		}
	`
	});

	const { members = [] } = result.componentDefinitions[0]?.declaration || {};

	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				attrName: undefined,
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: "STRING" }),
				visibility: "protected",
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
	//t.is(members.length, 0);
});

tsTest("LWC: Does not discover method", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
	import { LightningElement } from 'lwc';

	class MyElement extends LightningElement {
		 myProp(){}
	}`
	});
	const { members } = result.componentDefinitions[0]!.declaration!;
	t.is(members.length, 0);
});

tsTest("LWC: Discover method with @api", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
	import { LightningElement, api } from 'lwc';

	class MyElement extends LightningElement {
		 @api myProp(){}
	}`
	});
	const { members } = result.componentDefinitions[0]!.declaration!;
	t.is(members.length, 0);
});

tsTest("LWC: Discovers properties. all in one'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/c/myElement/myElement.js",
		text: `
			/**
			 */
			import { api, LightningElement } from 'lwc';
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
		`
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
				required: undefined
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
			}
		],
		t,
		checker
	);
});
