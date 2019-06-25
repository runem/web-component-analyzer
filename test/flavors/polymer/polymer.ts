import test from "ava";
import { isAssignableToSimpleTypeKind, SimpleTypeKind } from "ts-simple-type";
import { ComponentMember, ComponentMemberProperty } from "../../../src/analyze/types/component-member";
import { analyzeComponentsInCode } from "../../helpers/analyze-text";

test("Polymer components are correctly picked up", t => {
	const [{ result, checker }] = analyzeComponentsInCode(`
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

	t.log(result.componentDefinitions[0].declaration);

	const {
		declaration: { members }
	} = result.componentDefinitions[0];

	t.is(members.length, 3);

	const userProp = getComponentMemberWithName(members, "user");
	t.truthy(userProp);
	t.truthy(isAssignableToSimpleTypeKind(userProp!.type, SimpleTypeKind.STRING, checker));
	t.is(userProp!.attrName, "user");

	const isHappyProp = getComponentMemberWithName(members, "isHappy");
	t.truthy(isHappyProp);
	t.truthy(isAssignableToSimpleTypeKind(isHappyProp!.type, SimpleTypeKind.BOOLEAN, checker));
	t.is(isHappyProp!.attrName, "is-happy");

	const countProp = getComponentMemberWithName(members, "count");
	t.truthy(countProp);
	t.truthy(isAssignableToSimpleTypeKind(countProp!.type, SimpleTypeKind.NUMBER, checker));
	t.is(countProp!.attrName, "count");
	t.is(countProp!.default, 10);
});

function getComponentMemberWithName(members: ComponentMember[], propName: string) {
	return members.find(member => member.kind === "property" && member.propName === propName) as ComponentMemberProperty | undefined;
}
