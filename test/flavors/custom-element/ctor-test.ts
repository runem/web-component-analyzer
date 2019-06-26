import test from "ava";
import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getComponentProp } from "../../helpers/util";

test("Property assignments in the constructor are picked up", t => {
	const [{ result, checker }] = analyzeComponentsInCode(`
		class MyElement extends HTMLElement {
			constructor () {
				super();
				
				/**
				 * This is a property
				 */
				this.title = "My title";
				
				/**
				 * This property also has an attribute
				 * @attribute
				 */
				this.darkMode = false;
				
				this.location = { x: 0, y: 0 };
				
				this.#formatter = null;
				this._timeout = setTimeout(console.log, 1000);
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	t.log(result.componentDefinitions[0].declaration);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];

	const titleProp = getComponentProp(members, "title");
	t.truthy(titleProp);
	t.is(titleProp!.jsDoc!.comment, "This is a property");
	t.is(titleProp!.attrName, undefined);
	t.is(titleProp!.default, "My title");
	t.truthy(isAssignableToSimpleTypeKind(titleProp!.type, SimpleTypeKind.STRING, checker));

	const darkModeProp = getComponentProp(members, "darkMode");
	t.truthy(darkModeProp);
	t.is(darkModeProp!.jsDoc!.comment, "This property also has an attribute");
	t.is(darkModeProp!.attrName, "darkMode");
	t.is(darkModeProp!.default, false);
	t.truthy(isAssignableToSimpleTypeKind(darkModeProp!.type, SimpleTypeKind.BOOLEAN, checker));

	const locationProp = getComponentProp(members, "location");
	t.truthy(isAssignableToSimpleTypeKind(locationProp!.type, SimpleTypeKind.ANY, checker));
	t.deepEqual(locationProp!.default, { x: 0, y: 0 });

	t.is(getComponentProp(members, "#formatter"), undefined);
	t.is(getComponentProp(members, "_timeout"), undefined);
});

test("Property assignments in the constructor are correctly merged", t => {
	const [{ result }] = analyzeComponentsInCode(`
	    /**
	     * @attribute my-attr
	     */
		class MyElement extends HTMLElement {
			foo;
			
			constructor () {
				super();
				
				/**
				 * This is a property
				 * @attribute my-attr
				 */
				this.foo = "Bar";
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];

	t.log(members);

	t.is(members.length, 1);

	const fooProp = getComponentProp(members, "foo");
	t.truthy(fooProp);
	t.is(fooProp!.attrName, "my-attr");
	t.is(fooProp!.default, "Bar");
});

test("Property assignments in the constructor don't overwrite Typescript modifiers", t => {
	const [{ result }] = analyzeComponentsInCode(`
		class MyElement extends HTMLElement {
			private foo;
			
			constructor () {
				super();
				this.foo = "Bar";
			}
		}
		
		customElement.define("my-element", MyElement);
	 `);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];

	t.is(members.length, 0);
});
