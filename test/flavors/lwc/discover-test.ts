import path from "path";
import fs from "fs";

import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

// To run the test:
//    yarn ava --ext ts test/flavors/lwc/discover-test.ts

tsTest("LWC: Simple c-my-element ", t => {
	const {
		results: [result]
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
		results: [result]
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
		results: [result]
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

tsTest("LWC: From file convention", t => {
	const fileName = path.join(__dirname, "comp/c0/c0.js");
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: fileName,
		text: fs.readFileSync(fileName, "utf8")
	});

	const componentDefinitions = result.componentDefinitions || [];

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "comp-c0");
});

tsTest("LWC: Invalid template but Lighting Element inheritance", t => {
	const fileName = path.join(__dirname, "comp/c1/c1.js");
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: fileName,
		text: fs.readFileSync(fileName, "utf8")
	});

	const componentDefinitions = result.componentDefinitions || [];

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "comp-c1");
});

tsTest("LWC: Invalid template No Lighting Element inheritance", t => {
	const fileName = path.join(__dirname, "comp/c2/c2.js");
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: fileName,
		text: fs.readFileSync(fileName, "utf8")
	});

	const componentDefinitions = result.componentDefinitions || [];

	t.is(componentDefinitions.length, 0);
});

// PHIL: does not work reliably
//
tsTest("LWC: discover with JS tag ", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/c/your/anElement.js",
		text: `
		import { BaseComponent } from 'lwc';
		/**
		 * @lwcelement
		 */
        class MyElement extends BaseComponent {}`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "c-your");
});
tsTest("LWC: discover with JS tag with tag name", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "modules/c/your/anElement.js",
		text: `
		import { BaseComponent } from 'lwc';
		/**
		 * @lwcelement my-element
		 */
        class MyElement extends BaseComponent {}`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});
