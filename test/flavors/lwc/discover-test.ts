import { SimpleTypeKind } from "ts-simple-type";
import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";
import { assertHasMembers } from "../../helpers/util";

tsTest("LWC: Simple c-my-element ", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/c/myElement/myElement.js",
		text: `
        import { api, LightningElement } from 'lwc';
        class MyElement extends LightningElement {}`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "c-my-element");
});

tsTest("LWC: Simple custom-my-element ", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/custom/myElement/myElement.js",
		text: `
        import { api, LightningElement } from 'lwc';
        class MyElement extends LightningElement {}`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "custom-my-element");
});

tsTest("LWC: c-my-element ignores classname", t => {
	const {
		results: [result],
		checker
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/c/myElement/myElement.js",
		text: `
        import { api, LightningElement } from 'lwc';
        class CustomElement extends LightningElement {}`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "c-my-element");
});
