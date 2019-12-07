/**
 * Flattens an array.
 * Use this function to keep support for node 10
 * @param array
 */
export function arrayFlat<T>(array: T[][]): T[] {
	return "flat" in array ? array.flat() : (array as T[][]).reduce((acc, a) => [...acc, ...a], []);
}

/**
 * Filters an array returning only defined items
 * @param array
 */
export function arrayDefined<T>(array: (T | undefined)[]): T[] {
	return array.filter((item): item is NonNullable<typeof item> => item != null);
}
