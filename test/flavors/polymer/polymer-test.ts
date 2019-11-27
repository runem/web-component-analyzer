import test from "ava";
import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";
import { getComponentProp } from "../../helpers/util";

test.skip("Polymer components are correctly picked up", t => {
	const { result, checker } = analyzeComponentsInCode(`
		class XCustom extends PolymerElement {
			static get properties() {
				return {
					user: String,
					isHappy: Boolean,
					count: {
						type: Number,
						readOnly: true,
						notify: true,
						value: 10
					}
				}
			}
		}

		customElements.define('x-custom', XCustom);
	 `);

	const { members } = result.componentDefinitions[0].declaration();

	t.is(members.length, 3);

	const userProp = getComponentProp(members, "user");
	t.truthy(userProp);
	t.truthy(isAssignableToSimpleTypeKind(userProp!.type!(), SimpleTypeKind.STRING, checker));
	t.is(userProp!.attrName, "user");

	const isHappyProp = getComponentProp(members, "isHappy");
	t.truthy(isHappyProp);
	t.truthy(isAssignableToSimpleTypeKind(isHappyProp!.type!(), SimpleTypeKind.BOOLEAN, checker));
	t.is(isHappyProp!.attrName, "is-happy");

	const countProp = getComponentProp(members, "count");
	t.truthy(countProp);
	t.truthy(isAssignableToSimpleTypeKind(countProp!.type!(), SimpleTypeKind.NUMBER, checker));
	t.is(countProp!.attrName, "count");
	t.is(countProp!.default, 10);
});
