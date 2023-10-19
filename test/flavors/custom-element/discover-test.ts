import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("Discovers elements defined using customElements.define", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class MyElement extends HTMLElement {
		}

		customElements.define("my-element", MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

tsTest("Discovers elements defined using window.customElements.define", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class MyElement extends HTMLElement {
		}

		window.customElements.define("my-element", MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

tsTest("Discovers only one element defined using multiple customElements.define", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class MyElement extends HTMLElement {
		}

		customElements.define("my-element", MyElement);
		customElements.define("my-element", MyElement);
		customElements.define("my-element", MyElement);
		customElements.define("my-element", MyElement);
		customElements.define("my-element", MyElement);
		declare global {
			interface HTMLElementTagNameMap {
				"my-element": MyElement;
			}
		}
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

tsTest("Does not discover elements defined using custom define function", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		function define (tagName: string, elem: any) {}

		class MyElement extends HTMLElement {
		}

		define("my-element", MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 0);
});

tsTest("Discovers elements defined using customElements.define without string literal", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class MyElement extends HTMLElement {
			static get tag() {
				return "my-element";
			}
		}

		customElements.define(MyElement.tag, MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

tsTest("Doesn't crash when encountering component declaration nodes that can't be resolved", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		customElements.define("my-element", MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
	t.is(componentDefinitions[0].declaration, undefined);
});

tsTest("Discovers declaration in other file", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule([
		{
			analyze: true,
			fileName: "def.ts",
			text: `
				import {MyElement} from "./decl";
				customElements.define("my-element", MyElement);
			`
		},
		{
			fileName: "decl.ts",
			text: `
				/**
				 * hello
				 */
				export class MyElement extends HTMLElement {
				}
			`
		}
	]);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
	t.is(componentDefinitions[0].declaration?.jsDoc?.description, "hello");
});

tsTest("Correctly discovers multiple declarations", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule({
		fileName: "test.d.ts",
		text: `
			interface MyElement extends HTMLElement {
			}
			var MyElement: {
				prototype: MyElement;
				new (): MyElement;
			};
			customElements.define("my-element", MyElement);
		`
	});

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
	t.is(componentDefinitions[0].declaration?.members?.some(m => m.propName === "prototype"), false);
	t.is(componentDefinitions[0].declaration?.methods?.some(m => m.name === "new"), false);
});

tsTest("Discovers elements using typescript >=4.3 syntax", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
		class BaseElement extends HTMLElement {
			connectedCallback() {
				console.log(808);
			}
		}

		class MyElement extends BaseElement {
			override connectedCallback() {
				super.connectedCallback();
			}
		}

		customElements.define("my-element", MyElement);
	`);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});
