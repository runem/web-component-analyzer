import { SimpleTypeKind } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

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
	const { members } = result.componentDefinitions[0]?.declaration();
	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: SimpleTypeKind.STRING }),
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

tsTest("LWC: Discovers properties from '@track'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
	import { track, LightningElement } from 'lwc';

	class MyElement extends LightningElement {
         @track
         myProp = "hello 123";
	 }
	 `
	});
	const { members } = result.componentDefinitions[0]?.declaration();
	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: SimpleTypeKind.STRING }),
				visibility: "private",
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
});

tsTest("LWC: Discovers properties from '@track 2'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
	import { LightningElement } from 'lwc';

	class MyElement extends LightningElement {
         myProp = "hello 123";
	}`
	});
	const { members } = result.componentDefinitions[0]?.declaration();
	assertHasMembers(
		members,
		[
			{
				kind: "property",
				propName: "myProp",
				default: "hello 123",
				typeHint: undefined,
				type: () => ({ kind: SimpleTypeKind.STRING }),
				visibility: "private",
				reflect: undefined,
				deprecated: undefined,
				required: undefined
			}
		],
		t,
		checker
	);
});

tsTest("LWC: Discovers properties from '@track 3'", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
	import { LightningElement } from 'lwc';

	class MyElement extends LightningElement {
		 myProp(){}
	}`
	});
	const { members } = result.componentDefinitions[0]?.declaration();
	t.is(members.length, 0);
});
