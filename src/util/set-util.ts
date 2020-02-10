/**
 * Returns the first element in the set
 * @param set
 */
export function getFirst<T>(set: Set<T>): T | undefined {
	return set.values().next().value;
}
