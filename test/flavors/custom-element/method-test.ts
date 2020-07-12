import { analyzeTextWithCurrentTsModule } from "../../helpers/analyze-text-with-current-ts-module";
import { tsTest } from "../../helpers/ts-test";

tsTest("Correctly finds method declarations on a class", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		myMethod () {
		}
	}
	`);

	const { methods = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(methods.length, 1);
	t.is(methods[0].name, "myMethod");
});

tsTest("Doesn't pick up method declarations not on class declaration", t => {
	const {
		results: [result]
	} = analyzeTextWithCurrentTsModule(`
	/**
	 * @element
	 */
	class MyElement extends HTMLElement {
		myMethod () {
			lib.init({
			  fooMethod() {
			  }
			})
		}
	}
	`);

	const { methods = [] } = result.componentDefinitions[0]?.declaration || {};

	t.is(methods.length, 1);
	t.is(methods[0].name, "myMethod");
});
