import { JsDoc } from "../../types/js-doc";

export function mergeJsDocIntoJsDoc(leftJsDoc: JsDoc | undefined, rightJsDoc: JsDoc | undefined): JsDoc | undefined {
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
