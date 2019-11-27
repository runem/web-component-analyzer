/**
 * Flattens an array.
 * @param array
 */
export function arrayFlat<T>(array: T[][]): T[] {
	return "flat" in array ? array.flat() : (array as T[][]).reduce((acc, a) => [...acc, ...a], []);
}

export function arrayDefined<T>(array: (T | undefined)[]): T[] {
	return array.filter((item): item is NonNullable<typeof item> => item != null);
}
