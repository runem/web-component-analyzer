import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentMember } from "../types/component-member";
import { parseJsDocTag } from "../util/js-doc-util";

/**
 * Run through all components expanding them with the associated jsdoc.
 * @param members
 */
export function expandMembersFromJsDoc(members: ComponentMember[]): ComponentMember[] {
	return members.map(expandMemberFromJsDoc);
}

/**
 * Expand a single member with qualities from the associated jsdoc.
 * @param member
 */
export function expandMemberFromJsDoc(member: ComponentMember): ComponentMember {
	// Return right away if the member doesn't have jsdoc
	if (member.jsDoc == null || member.jsDoc.tags == null) return member;

	const newMember = { ...member };

	// Check "@deprecated"
	const deprecatedTag = member.jsDoc.tags.find(t => t.tag === "deprecated");
	if (deprecatedTag != null) {
		newMember.deprecated = deprecatedTag.comment || true;
	}

	// Check "@prop {Number} myProp - My comment"
	if (newMember.kind === "property" && newMember.attrName == null) {
		const attrNameTag = member.jsDoc.tags.find(t => ["attr", "attribute"].includes(t.tag));
		if (attrNameTag != null) {
			newMember.attrName = parseJsDocTag(attrNameTag).name || newMember.propName;
		}
	}

	// Check "@required" and "@optional"
	if (newMember.kind === "attribute" || newMember.kind === "property") {
		if (member.jsDoc.tags.find(t => t.tag === "optional") != null) {
			newMember.required = false;
		}

		if (member.jsDoc.tags.find(t => t.tag === "required") != null) {
			newMember.required = true;
		}
	}

	return newMember;
}

/**
 * Expand a component declaration with qualities from associated jsdoc
 * @param declaration
 */
export function expandDeclarationFromJsDoc(declaration: ComponentDeclaration): ComponentDeclaration {
	if (declaration.jsDoc == null || declaration.jsDoc.tags == null) return declaration;

	const newDeclaration = { ...declaration };

	// Check "@deprecated"
	const deprecatedTag = declaration.jsDoc.tags.find(t => t.tag === "deprecated");
	if (deprecatedTag != null) {
		newDeclaration.deprecated = deprecatedTag.comment || true;
	}

	return newDeclaration;
}
