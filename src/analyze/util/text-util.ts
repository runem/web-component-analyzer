/**
 * Converts from snake case to camel case
 * @param str
 */
export function dashToCamelCase(str: string): string {
	return str.replace(/(-\w)/g, m => m[1].toUpperCase());
}

/**
 * Converts from camel case to snake case
 * @param str
 */
export function camelToDashCase(str: string): string {
	return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
}

/**
 * Returns if a name is private (starts with "_" or "#");
 * @param name	 * @param name
 */
export function isNamePrivate(name: string): boolean {
	return name.startsWith("_") || name.startsWith("#");
}
