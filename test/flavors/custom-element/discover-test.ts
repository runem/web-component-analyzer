import test from "ava";
import { analyzeText } from "../../../src/analyze/analyze-text";

test("Discovers elements defined using customElements.define", t => {
	const { result } = analyzeText(`
		class MyElement extends HTMLElement {
		}
		
		customElements.define("my-element", MyElement);
	 `);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

test("Discovers elements defined using window.customElements.define", t => {
	const { result } = analyzeText(`
		class MyElement extends HTMLElement {
		}
		
		window.customElements.define("my-element", MyElement);
	 `);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 1);
	t.is(componentDefinitions[0].tagName, "my-element");
});

test("Discovers only one element defined using multiple customElements.define", t => {
	const { result } = analyzeText(`
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

test("Does not discover elements defined using custom define function", t => {
	const { result } = analyzeText(`
		function define (tagName: string, elem: any) {}
		
		class MyElement extends HTMLElement {
		}
		
		define("my-element", MyElement);
	 `);

	const { componentDefinitions } = result;

	t.is(componentDefinitions.length, 0);
});

test("Discovers elements defined using customElements.define without string literal", t => {
	const { result } = analyzeText(`
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
