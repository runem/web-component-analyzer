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
