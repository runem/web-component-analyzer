import { tsTest } from "../../helpers/ts-test";
import { findAttributeOfName, findHtmlElementOfName, findPropertyOfName, runAndParseWebtypesBuild } from "../../helpers/webtypes-test-utils";
import { Type } from "../../../src/transformers/webtypes/webtypes-schema";

tsTest("Transformer: Webtypes: Attributes and properties only present if needed", t => {
	const res = runAndParseWebtypesBuild(`
	@customElement('my-element')
	class MyElement extends HTMLElement { 
		@property({type: String, attribute: "my-prop"}) myProp: string;
		@property({type: String, attribute: false}) myProp2: string;
 	}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);
	t.is(myElement?.attributes?.length, 1);
	t.is(myElement?.js?.properties?.length, 2);
	t.truthy(findAttributeOfName(myElement, "my-prop"));
	t.truthy(findPropertyOfName(myElement, "myProp"));
	t.truthy(findPropertyOfName(myElement, "myProp2"));
});

tsTest("Transformer: Webtypes: Attributes and properties default value", t => {
	const res = runAndParseWebtypesBuild(`
	@customElement('my-element')
	class MyElement extends HTMLElement { 
		@property({type: String, attribute: "my-prop"}) myProp: string;
		@property({type: String, attribute: "my-prop2"}) myProp2: string = "testValue";
 	}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);
	t.is(myElement?.attributes?.length, 2);
	t.is(myElement?.js?.properties?.length, 2);
	const att1 = findAttributeOfName(myElement, "my-prop");
	const att2 = findAttributeOfName(myElement, "my-prop2");
	const prop1 = findPropertyOfName(myElement, "myProp");
	const prop2 = findPropertyOfName(myElement, "myProp2");

	t.is(att1?.value?.type, "string");
	t.false(att1?.required);
	t.true(att1?.value?.required);
	t.is(att1?.value?.default, undefined);

	t.is(att2?.value?.type, "string");
	t.false(att2?.required);
	t.true(att2?.value?.required);
	t.is(att2?.value?.default, '"testValue"');

	t.is(prop1?.value?.type, "string");
	t.false(prop1?.required);
	t.true(prop1?.value?.required);
	t.is(prop1?.value?.default, undefined);

	t.is(prop2?.value?.type, "string");
	t.false(prop2?.required);
	t.true(prop2?.value?.required);
	t.is(prop2?.value?.default, '"testValue"');
});

tsTest("Transformer: Webtypes: Boolean value not required", t => {
	const res = runAndParseWebtypesBuild(`
	@customElement('my-element')
	class MyElement extends HTMLElement { 
		@property({type: Boolean, attribute: "my-prop"}) myProp: boolean;
		@property({type: Boolean, attribute: "my-prop2"}) myProp2: boolean | undefined = false;
 	}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);
	t.is(myElement?.attributes?.length, 2);
	t.is(myElement?.js?.properties?.length, 2);
	const att1 = findAttributeOfName(myElement, "my-prop");
	const att2 = findAttributeOfName(myElement, "my-prop2");
	const prop1 = findPropertyOfName(myElement, "myProp");
	const prop2 = findPropertyOfName(myElement, "myProp2");

	t.is(att1?.value?.type, "boolean");
	t.false(att1?.required);
	t.false(att1?.value?.required);
	t.is(att1?.value?.default, undefined);

	t.is((att2?.value?.type as Array<Type>)?.length, 2);
	t.true((att2?.value?.type as Array<Type>)?.includes("boolean"));
	t.true((att2?.value?.type as Array<Type>)?.includes("undefined"));
	t.false(att2?.required);
	t.false(att2?.value?.required);
	t.is(att2?.value?.default, "false");

	t.is(prop1?.value?.type, "boolean");
	t.false(prop1?.required);
	t.false(prop1?.value?.required);
	t.is(prop1?.value?.default, undefined);

	t.is((prop2?.value?.type as Array<Type>)?.length, 2);
	t.true((prop2?.value?.type as Array<Type>)?.includes("boolean"));
	t.true((prop2?.value?.type as Array<Type>)?.includes("undefined"));
	t.false(prop2?.required);
	t.false(prop2?.value?.required);
	t.is(prop2?.value?.default, "false");
});

tsTest("Transformer: Webtypes: Enum values", t => {
	const res = runAndParseWebtypesBuild(`
	@customElement('my-element')
	class MyElement extends HTMLElement {
		/**
		 * @type {'foo' | 'bar'}
		 */
		@property({type: String, attribute: "my-prop"}) myProp = "foo";
 	}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);

	t.is(myElement?.attributes?.length, 1);
	t.is(myElement?.js?.properties?.length, 1);
	const att1 = findAttributeOfName(myElement, "my-prop");
	const prop1 = findPropertyOfName(myElement, "myProp");

	t.is(att1?.value?.type, "'foo' | 'bar'");
	t.false(att1?.required);
	t.is(att1?.value?.kind, "plain");
	t.true(att1?.value?.required);
	t.is(att1?.value?.default, '"foo"');

	t.is(prop1?.value?.type, "'foo' | 'bar'");
	t.false(prop1?.required);
	t.is(prop1?.value?.kind, "plain");
	t.true(prop1?.value?.required);
	t.is(prop1?.value?.default, '"foo"');
});

tsTest("Transformer: Webtypes: Slots values", t => {
	const res = runAndParseWebtypesBuild(`
	/**
	 * @slot - Default slot desc
	 * @slot named-slot - Named slot desc
	 */
	@customElement('my-element')
	class MyElement extends HTMLElement {}
 	`);

	const myElement = findHtmlElementOfName(res, "my-element");
	t.truthy(myElement);

	t.is(myElement?.slots?.length, 2);
	const defaultSlot = myElement?.slots?.find(slot => slot.name == "");
	const namedSlot = myElement?.slots?.find(slot => slot.name == "named-slot");

	t.is(defaultSlot?.description, "Default slot desc");
	t.is(namedSlot?.description, "Named slot desc");
});
