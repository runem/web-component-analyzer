import { ExecutionContext } from "ava";
import { isAssignableToType, typeToString } from "ts-simple-type";
import { TypeChecker } from "typescript";
import { ComponentMember, ComponentMemberProperty } from "../../src/analyze/types/features/component-member";
import { arrayDefined } from "../../src/util/array-util";

export function assertHasMembers(
	actualMembers: ComponentMember[],
	expectedMembers: Partial<ComponentMember>[],
	t: ExecutionContext,
	checker?: TypeChecker
): void {
	t.log(actualMembers);

	t.is(actualMembers.length, expectedMembers.length);

	for (const expectedMember of expectedMembers) {
		const matchedMembers = actualMembers.filter(
			member => expectedMember.kind === member.kind && expectedMember.attrName === member.attrName && expectedMember.propName === member.propName
		);

		t.is(
			matchedMembers.length,
			1,
			`Couldn't find a member with kind: ${expectedMember.kind}, attrName: ${expectedMember.attrName} and propName: ${expectedMember.propName}`
		);

		const actualMember = matchedMembers[0];

		const name = expectedMember.propName || expectedMember.attrName;

		"attrName" in expectedMember && t.is(actualMember.attrName, expectedMember.attrName, `Attribute names are not the same`);
		"propName" in expectedMember && t.is(actualMember.propName, expectedMember.propName, `Property names are not the same`);
		"default" in expectedMember && t.deepEqual(actualMember.default, expectedMember.default, `Default value for ${name} doesn't match`);
		"visibility" in expectedMember && t.is(actualMember.visibility, expectedMember.visibility, `Visibility for ${name} doesn't match`);
		"reflect" in expectedMember && t.is(actualMember.reflect, expectedMember.reflect, `Reflect for ${name} doesn't match`);
		"required" in expectedMember && t.is(actualMember.required, expectedMember.required, `Required for ${name} doesn't match`);
		"deprecated" in expectedMember && t.is(actualMember.deprecated, expectedMember.deprecated, `Deprecated for ${name} doesn't match`);
		"typeHint" in expectedMember && t.is(actualMember.typeHint, expectedMember.typeHint, `TypeHint for ${name} doesn't match`);
		"jsDoc" in expectedMember && t.is(actualMember?.jsDoc?.description, expectedMember?.jsDoc?.description, `JSDoc for ${name} doesn't match`);
		if ("meta" in expectedMember) {
			const metaWithoutNode = { ...(actualMember?.meta || {}) };
			delete metaWithoutNode.node;
			t.deepEqual(metaWithoutNode, expectedMember?.meta, `Meta for ${name} doesn't match`);
		}

		if ("type" in expectedMember) {
			t.is(typeof actualMember.type, typeof expectedMember.type);

			if (expectedMember.type != null && actualMember.type != null) {
				if (checker == null) {
					throw new Error("Type checker is not given to assert util!");
				}
				const typeA = actualMember.type();
				const typeB = expectedMember.type();
				t.truthy(
					isAssignableToType(typeA, typeB, checker),
					`Type for ${name} doesn't match: ${typeToString(typeA, checker)} === ${typeToString(typeB, checker)}`
				);
			}
		}
	}
}

export function getComponentProp(members: ComponentMember[], propName: string): ComponentMemberProperty | undefined {
	return members.find(member => member.kind === "property" && member.propName === propName) as ComponentMemberProperty | undefined;
}

export function getAttributeNames(members: ComponentMember[]): string[] {
	return arrayDefined(members.map(member => ("attrName" in member ? member.attrName : undefined)));
}

export function getPropertyNames(members: ComponentMember[]): string[] {
	return arrayDefined(members.map(member => (member.kind === "property" ? member.propName : undefined)));
}
