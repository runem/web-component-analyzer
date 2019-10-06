import test from "ava";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getComponentProp } from "../../helpers/util";

test("jsdoc: Property with default visibility", t => {
	const { result } = analyzeComponentsInCode(`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	    myProp = "foo";
	 }
	 `);

	const { members } = result.componentDefinitions[0].declaration;

	const prop = getComponentProp(members, "myProp");
	t.truthy(prop);
	t.is(prop!.visibility, "public");
});

test("jsdoc: Property with @private jsdoc", t => {
	const { result } = analyzeComponentsInCode(
		`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	    /**
	     * @private
	     */
	    myProp = "foo";
	 }
	 `,
		{ visibility: "private" }
	);

	const { members } = result.componentDefinitions[0].declaration;

	const prop = getComponentProp(members, "myProp");
	t.truthy(prop);
	t.is(prop!.visibility, "private");
});

test("jsdoc: Property that starts with underscore (private)", t => {
	const { result } = analyzeComponentsInCode(
		`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
	    _myProp = "foo";
	 }
	 `,
		{ visibility: "private" }
	);

	const { members } = result.componentDefinitions[0].declaration;

	const prop = getComponentProp(members, "_myProp");
	t.truthy(prop);
	t.is(prop!.visibility, "private");
});

test("jsdoc: Property with @protected jsdoc", t => {
	const { result } = analyzeComponentsInCode(
		`
	/**
	 * @element
	 */
	 class MyElement extends HTMLElement { 
		/**
		 * @protected
	     */
	    myProp = "foo";
	 }
	 `,
		{ visibility: "private" }
	);

	const { members } = result.componentDefinitions[0].declaration;

	const prop = getComponentProp(members, "myProp");
	t.truthy(prop);
	t.is(prop!.visibility, "protected");
});
