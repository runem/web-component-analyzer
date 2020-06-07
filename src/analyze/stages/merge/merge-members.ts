import { TypeChecker } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { PriorityKind } from "../../flavors/analyzer-flavor";
import { ComponentMember, ComponentMemberAttribute, ComponentMemberProperty } from "../../types/features/component-member";
import { mergeJsDoc, mergeModifiers } from "./merge-util";

const priorityValueMap: Record<PriorityKind, number> = {
	low: 0,
	medium: 1,
	high: 2
};

interface MergeMap {
	props: Map<string, ComponentMemberProperty>;
	attrs: Map<string, ComponentMemberAttribute>;
}

/**
 * Merges multiple members based on priority
 * @param members
 * @param context
 */
export function mergeMembers(members: ComponentMember[], context: AnalyzerVisitContext): ComponentMember[] {
	// Start merging by sorting member results from high to low priority.
	// If two priorities are the same: prioritize the first found element
	// From node 11, equal elements keep their order after sort, but not in node 10
	// Therefore we use "indexOf" to return correct order if two priorities are equal
	members = [...members].sort((a, b) => {
		const vA = priorityValueMap[a.priority || "low"];
		const vB = priorityValueMap[b.priority || "low"];

		if (vA === vB) {
			const iA = members.indexOf(a);
			const iB = members.indexOf(b);

			return iA < iB ? -1 : 1;
		}

		return vA < vB ? 1 : -1;
	});

	// Keep track of merged props and merged attributes
	// These are stored in maps for speed, because we are going to lookup a member per each memberResult
	const mergeMap: MergeMap = {
		props: new Map<string, ComponentMemberProperty>(),
		attrs: new Map<string, ComponentMemberAttribute>()
	};

	// Merge all members one by one adding them to the merge map
	for (const member of members) {
		// Find a member that is similar to this member
		const mergeableMember = findMemberToMerge(member, mergeMap);
		let newMember: ComponentMember | undefined = undefined;

		if (mergeableMember == null) {
			// No mergeable member was found, so just add this to the map
			newMember = member;
		} else {
			// Remove "member" and "mergeableMember" from the merge map
			// We are going to merge those and add the result to the merge map again
			clearMergeMapWithMember(mergeableMember, mergeMap);
			clearMergeMapWithMember(member, mergeMap);

			newMember = mergeMemberIntoMember(mergeableMember, member, context.checker);
		}

		// Add to merge map
		switch (newMember.kind) {
			case "attribute":
				mergeMap.attrs.set(newMember.attrName, newMember);
				break;
			case "property":
				mergeMap.props.set(newMember.propName, newMember);
				break;
		}
	}

	// Return merged results with only "high" priorities
	return [...mergeMap.props.values(), ...mergeMap.attrs.values()].map(member => ({ ...member, priority: "high" }));
}

/**
 * Removes a member from the merge map
 * @param member
 * @param mergeMap
 */
function clearMergeMapWithMember(member: ComponentMember, mergeMap: MergeMap) {
	switch (member.kind) {
		case "attribute":
			mergeMap.attrs.delete(member.attrName);
			break;
		case "property":
			mergeMap.props.delete(member.propName);
			if (member.attrName != null) {
				mergeMap.attrs.delete(member.attrName);
			}
			break;
	}
}

/**
 * Finds a mergeable member
 * @param similar
 * @param mergeMap
 */
function findMemberToMerge(similar: ComponentMember, mergeMap: MergeMap): ComponentMember | undefined {
	const attrName = similar.attrName; //?.toLowerCase(); // (similar.kind === "attribute" && similar.attrName.toLowerCase()) || undefined;
	const propName = similar.propName; /*?.toLowerCase()*/ //(similar.kind === "property" && similar.propName.toLowerCase()) || undefined;

	// Return a member that matches either propName (prioritized) or attrName
	if (propName != null) {
		const mergeable = mergeMap.props.get(propName) || mergeMap.attrs.get(propName);
		if (mergeable != null) {
			return mergeable;
		}
	}

	if (attrName != null) {
		const mergeableAttr = mergeMap.attrs.get(attrName);
		if (mergeableAttr != null) {
			return mergeableAttr;
		}

		// Try to find a prop with the attr name.
		// Don't return the prop if it already has an attribute that is not equals to the attr name
		const mergeableProp = mergeMap.props.get(attrName);
		if (mergeableProp != null && mergeableProp.attrName == null) {
			return mergeableProp;
		}

		for (const mergedAttr of mergeMap.props.values()) {
			if (mergedAttr.attrName === attrName) {
				return mergedAttr;
			}
		}
	}
}

/**
 * Merges two members of the same kind into each other.
 * This operation prioritizes leftMember
 * @param leftMember
 * @param rightMember
 * @param checker
 */
function mergeMemberIntoMember<T extends ComponentMemberProperty | ComponentMemberAttribute>(leftMember: T, rightMember: T, checker: TypeChecker): T {
	// Always prioritize merging attribute into property if possible
	if (leftMember.kind === "attribute" && rightMember.kind === "property") {
		return mergeMemberIntoMember(rightMember, leftMember, checker);
	}

	return {
		...leftMember,
		attrName: leftMember.attrName ?? rightMember.attrName,
		type: (() => {
			// Always prioritize a "property" over an "attribute" when merging types
			if (leftMember.kind === rightMember.kind || leftMember.kind === "property") {
				return leftMember.type ?? rightMember.type;
			} else if (rightMember.kind === "property") {
				return rightMember.type ?? leftMember.type;
			}
		})(),
		typeHint: leftMember.typeHint ?? rightMember.typeHint,
		jsDoc: mergeJsDoc(leftMember.jsDoc, rightMember.jsDoc),
		modifiers: mergeModifiers(leftMember.modifiers, rightMember.modifiers),
		meta: leftMember.meta ?? rightMember.meta,
		default: leftMember.default === undefined ? rightMember.default : leftMember.default,
		required: leftMember.required ?? rightMember.required,
		visibility: leftMember.visibility ?? rightMember.visibility,
		deprecated: leftMember.deprecated ?? rightMember.deprecated,
		declaration: rightMember.declaration ?? leftMember.declaration
	};
}
