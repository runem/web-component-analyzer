import { isAssignableToSimpleTypeKind, isSimpleType, SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { Type, TypeChecker } from "typescript";
import { FlavorVisitContext } from "../flavors/parse-component-flavor";
import { ComponentCSSPart } from "../types/component-css-part";
import { ComponentCSSProperty } from "../types/component-css-property";
import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentMember, ComponentMemberAttribute, ComponentMemberProperty } from "../types/component-member";
import { ComponentSlot } from "../types/component-slot";
import { EventDeclaration } from "../types/event-types";
import { JsDoc } from "../types/js-doc";
import { mergeJsDocs } from "./merge-js-docs";

/**
 * Merges multiple component declarations.
 * @param declarations
 * @param context
 */
export function mergeDeclarations(declarations: ComponentDeclaration[], context: FlavorVisitContext): ComponentDeclaration {
	// Return right away if there is only 1 declaration.
	if (declarations.length === 1) return declarations[0];

	// Collect all items from all declarations.
	const members = declarations.map(dec => dec.members).reduce((acc, members) => [...acc, ...members], []);
	const events = declarations.map(dec => dec.events).reduce((acc, events) => [...acc, ...events], []);
	const slots = declarations.map(dec => dec.slots).reduce((acc, slots) => [...acc, ...slots], []);
	const cssProps = declarations.map(dec => dec.cssProperties).reduce((acc, cssProps) => [...acc, ...cssProps], []);

	// Merge all items
	const mergedJsDoc = mergeJsDocs(declarations[0].jsDoc, declarations.slice(1).map(dec => dec.jsDoc));
	const mergedMembers = mergeMembers(members, context);
	const mergedSlots = mergeSlots(slots);
	const mergedEvents = mergeEvents(events);
	const mergedCSSProps = mergeCSSProps(cssProps);

	return {
		...declarations[0],
		jsDoc: mergedJsDoc,
		members: mergedMembers,
		slots: mergedSlots,
		events: mergedEvents,
		cssProperties: mergedCSSProps
	};
}

/**
 * Merges slots
 * @param slots
 */
export function mergeSlots(slots: ComponentSlot[]): ComponentSlot[] {
	return nameMerge(slots, "last");
}

/**
 * Merges events
 * @param events
 */
export function mergeEvents(events: EventDeclaration[]): EventDeclaration[] {
	return nameMerge(events, "last");
}

/**
 * Merges css props
 * @param cssProps
 */
export function mergeCSSProps(cssProps: ComponentCSSProperty[]): ComponentCSSProperty[] {
	return nameMerge(cssProps, "last");
}

/**
 * Merges css parts
 * @param cssParts
 */
export function mergeCSSParts(cssParts: ComponentCSSPart[]): ComponentCSSPart[] {
	return nameMerge(cssParts, "last");
}

/**
 * Merges based on a name and a direction.
 * "first": Only keep the first found item.
 * "last": Only keep the last found item.
 * This function always prefers one of the entries' jsDoc if defined
 * @param entries
 * @param direction
 */
function nameMerge<T extends { name?: string; jsDoc?: JsDoc }>(entries: T[], direction: "last" | "first"): T[] {
	if (direction === "last") entries = entries.reverse();

	const merged = new Map<string, T>();
	for (const entry of entries) {
		const existing = merged.get(entry.name || "");

		if (existing == null) {
			merged.set(entry.name || "", entry);
		} else if (existing.jsDoc == null && entry.jsDoc != null) {
			merged.set(entry.name || "", { ...existing, jsDoc: entry.jsDoc });
		}
	}
	return Array.from(merged.values());
}

/**
 * Merges all members in the list of members.
 * @param members
 * @param context
 */
export function mergeMembers(members: ComponentMember[], context: FlavorVisitContext): ComponentMember[] {
	const mergedMembers: ComponentMember[] = [];

	// Loop through all members adding merged members to "mergedMembers"
	for (const member of members) {
		// Find a member that can be merged
		const existing = findMemberToMerge(mergedMembers, member);

		if (existing != null) {
			// Remove the item from the list and add the merged member
			mergedMembers.splice(mergedMembers.findIndex(m => m === existing), 1);
			const mergedMember = mergeMember(existing, member, context.checker);
			mergedMembers.push(mergedMember);

			// If we are merging into a property we may need to remove a corresponding attribute if present, because it's not represented from the property.
			if (mergedMember.kind === "property" && "attrName" in mergedMember) {
				const indexWithAttrName = mergedMembers.findIndex(m => m.kind === "attribute" && m.attrName === mergedMember.attrName);
				if (indexWithAttrName >= 0) {
					mergedMembers.splice(indexWithAttrName, 1);
				}
			}
		} else {
			mergedMembers.push(member);
		}
	}

	return mergedMembers;
}

/**
 * Returns a member that can be merged with "similar".
 * @param members
 * @param similar
 */
function findMemberToMerge(members: ComponentMember[], similar: ComponentMember): ComponentMember | undefined {
	if (similar.kind === "method") return undefined;

	// Merges attributes and properties based on the lowercased version of the name.
	const attrName = (similar.kind === "attribute" && similar.attrName.toLowerCase()) || undefined;
	const propName = (similar.kind === "property" && similar.propName.toLowerCase()) || undefined;

	// Return a member that matches either attrName or propName
	return members.find(member => {
		switch (member.kind) {
			case "attribute":
				return [attrName, propName].includes(member.attrName.toLowerCase());
			case "property":
				// If the member has an attrName compare it to the "attrName" of "similar"
				return (
					[attrName, propName].includes(member.propName.toLowerCase()) ||
					(member.attrName != null ? member.attrName.toLowerCase() === attrName : false)
				);
		}

		return false;
	});
}

/**
 * Merges two members
 * @param existing
 * @param newest
 * @param checker
 */
function mergeMember(existing: ComponentMember, newest: ComponentMember, checker: TypeChecker): ComponentMember {
	switch (existing.kind) {
		case "property":
			switch (newest.kind) {
				case "property":
					return mergeMemberIntoMember(existing, newest, checker);
				case "attribute":
					return mergeAttrIntoProp(existing, newest, checker);
			}
			break;

		case "attribute":
			switch (newest.kind) {
				case "property":
					return mergeAttrIntoProp(newest, existing, checker);
				case "attribute":
					return mergeMemberIntoMember(existing, newest, checker);
			}
			break;
	}

	return existing;
}

/**
 * Merges an attribute into a property.
 * This operation prioritizes "attribute".
 * @param prop
 * @param attr
 * @param checker
 */
function mergeAttrIntoProp(prop: ComponentMemberProperty, attr: ComponentMemberAttribute, checker: TypeChecker): ComponentMemberProperty {
	return {
		...prop,
		type: mergeTypes(prop.type, attr.type, checker),
		default: attr.default || prop.default,
		required: attr.required || prop.required,
		jsDoc: attr.jsDoc || prop.jsDoc,
		attrName: attr.attrName
	};
}

/**
 * Merges to members of the same kind into each other.
 * This operation basically merged their types and prioritizes "b".
 * @param a
 * @param b
 * @param checker
 */
function mergeMemberIntoMember<T extends ComponentMemberProperty | ComponentMemberAttribute>(a: T, b: T, checker: TypeChecker): T {
	return {
		...b,
		attrName: a.attrName || b.attrName,
		type: mergeTypes(a.type, b.type, checker),
		default: a.default || b.default,
		jsDoc: a.jsDoc || b.jsDoc
	};
}

/**
 * Merges two types into each other.
 * This operation prioritizes "typeB" and returns "typeA" only if "typeB" is ANY and "typeA" is not ANY.
 * @param typeA
 * @param typeB
 * @param checker
 */
function mergeTypes(typeA: SimpleType | Type, typeB: SimpleType | Type, checker: TypeChecker): SimpleType | Type {
	const simpleTypeB = isSimpleType(typeB) ? typeB : toSimpleType(typeB, checker);

	// If type B isn't assignable to "ANY", return it!
	if (!isAssignableToSimpleTypeKind(simpleTypeB, SimpleTypeKind.ANY)) {
		return typeB;
	}

	// Else if type A isn't assignable to "ANY" return it
	else if (!isAssignableToSimpleTypeKind(typeA, SimpleTypeKind.ANY, checker)) {
		return typeA;
	}

	// Else return "typeB"
	return typeB;
}
