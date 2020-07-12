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
