/**
 * Returns true if the given input is a valid custom element name
 * @param {string} input
 * @return {boolean}
 */
export function isValidCustomElementName(input: string): boolean {
	return input.includes("-");
}
