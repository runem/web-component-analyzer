import { JsDoc } from "../../types/js-doc";
import { ModifierKind } from "../../types/modifier-kind";
/**
 * Merges based on a name
 * @param entries
 * @param direction
 * @param getName
 * @param merge
 */
export function mergeNamedEntries<T>(entries: T[], getName: (entry: T) => string, merge?: (left: T, right: T) => T): T[] {
	const merged = new Map<string, T>();

	for (const entry of entries) {
		const name = getName(entry);

		const existing = merged.get(name);

		if (existing == null) {
			merged.set(name, entry);
		} else if (merge != null) {
			merged.set(name, merge(existing, entry));
		}
	}

	return Array.from(merged.values());
}

/**
 * Merges two jsdocs
 * @param leftJsDoc
 * @param rightJsDoc
 */
export function mergeJsDoc(leftJsDoc: JsDoc | undefined, rightJsDoc: JsDoc | undefined): JsDoc | undefined {
	if (leftJsDoc == null) {
		return rightJsDoc;
	} else if (rightJsDoc == null) {
		return leftJsDoc;
	}

	return {
		...(leftJsDoc ?? rightJsDoc),
		description: leftJsDoc.description ?? rightJsDoc.description
	};
}

/**
 * Merges modifiers
 * @param leftModifiers
 * @param rightModifiers
 */
export function mergeModifiers(
	leftModifiers: Set<ModifierKind> | undefined,
	rightModifiers: Set<ModifierKind> | undefined
): Set<ModifierKind> | undefined {
	const newSet = new Set<ModifierKind>();

	if (leftModifiers?.has("static") && rightModifiers?.has("static")) {
		newSet.add("static");
	}

	if (leftModifiers?.has("readonly") && rightModifiers?.has("readonly")) {
		newSet.add("readonly");
	}

	if (newSet.size === 0) {
		return undefined;
	}

	return newSet;
}

/**
 * Merges entries using a "merge" callback
 * @param entries
 * @param isMergeable
 * @param merge
 */
/*export function mergeEntries<T>(entries: T[], isMergeable: (entry: T, merged: T) => boolean, merge: (left: T, right: T) => T): T[] {
	let mergedEntries: T[] = [];

	for (const entry of entries) {
		let mergeableEntry: T | undefined = undefined;
		for (const mergedEntry of mergedEntries) {
			if (isMergeable(entry, mergedEntry)) {
				mergeableEntry = mergedEntry;
				break;
			}
		}

		let newEntry: T | undefined = undefined;
		if (mergeableEntry == null) {
			newEntry = entry;
		} else {
			mergedEntries = mergedEntries.filter(mergedEntry => mergedEntry !== entry && mergedEntry !== mergeableEntry);
			newEntry = merge(mergeableEntry, entry);
		}
		mergedEntries.push(newEntry);
	}

	return mergedEntries;
}*/
