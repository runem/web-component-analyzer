/**
 * Flattens an array.
 * @param array
 */
export function flatten<T>(array: T[][]): T[] {
	return array.reduce((acc, a) => [...acc, ...a], []);
}
