import { tsTest } from "../../helpers/ts-test";
import { runAndParseWebtypesBuild } from "../../helpers/webtypes-test-utils";

tsTest("Transformer: Webtypes: CSS properties test", t => {
	const res = runAndParseWebtypesBuild(`
	/**
	 * @cssprop [--var-test] - Var test desc
	 * @cssprop [--var-test2=48px] - Var test desc with default value
	 */
	@customElement('my-element')
	class MyElement extends HTMLElement {}
 	`);

	const cssProps = res?.contributions?.css?.properties;
	t.truthy(cssProps);
	t.is(cssProps?.length, 2);

	const varTest = cssProps?.find(cp => cp.name == "--var-test");
	t.truthy(varTest);
	t.is(varTest?.description, "Var test desc");

	const varTest2 = cssProps?.find(cp => cp.name == "--var-test2");
	t.truthy(varTest2);
	t.is(varTest2?.description, "Var test desc with default value\n\n**Default:** 48px");
	// default value not put in CSS
});
