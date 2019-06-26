import { ComponentMember, ComponentMemberProperty } from "../../src/analyze/types/component-member";

export function getComponentProp(members: ComponentMember[], propName: string) {
	return members.find(member => member.kind === "property" && member.propName === propName) as ComponentMemberProperty | undefined;
}

export function getAttributeNames(members: ComponentMember[]): string[] {
	return members.map(member => ("attrName" in member ? member.attrName : undefined)).filter((n): n is NonNullable<typeof n> => n != null);
}
