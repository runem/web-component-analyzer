/**
 * Flattens an array.
 * Use this function to keep support for node 10
 * @param items
 */
export function arrayFlat<T>(items: (T[] | T)[]): T[] {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	if ("flat" in (items as any)) {
		return items.flat();
	}

	const flattenArray: T[] = [];
	for (const item of items) {
		flattenArray.push(...item);
	}
	return flattenArray;
}

/**
 * Filters an array returning only defined items
 * @param array
 */
export function arrayDefined<T>(array: (T | undefined)[]): T[] {
	return array.filter((item): item is NonNullable<typeof item> => item != null);
}
