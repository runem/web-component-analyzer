/**
 * According to {@link https://html.spec.whatwg.org/multipage/syntax.html#attributes-2}, the following Unicode characters are illegal in an attribute name
 * @type {RegExp}
 */
const ILLEGAL_UNICODE_CHARACTERS: RegExp = /[\u0020\u0022\u0027\u003E\u002F\u003D]/g;

/**
 * According to {@link https://infra.spec.whatwg.org/#noncharacter},
 * a noncharacter is a codepoint that matches any of the given unicode characters
 * @type {RegExp}
 */
const NONCHARACTERS: RegExp = /[\uFFFF\uFFFE\uFDD1\uFDD2\uFDD3\uFDD4\uFDD5\uFDD6\uFDD7\uFDD8\uFDD9\uFDDA\uFDDB\uFDDC\uFDDD\uFDDE\uFDDF\uFDE0\uFDE1\uFDE2\uFDE3\uFDE4\uFDE5\uFDE6\uFDE7\uFDE8\uFDE9\uFDEA\uFDEB\uFDEC\uFDED\uFDEE\uFDEF]/g;

/**
 * The HTML spec defines what are valid characters in an attribute name {@link https://html.spec.whatwg.org/multipage/syntax.html#attributes-2}.
 * This helper functions ensures that the given input conforms to those rules
 * @param {string} name
 * @return {string}
 */
export function sanitizeAttributeName(name: string): string {
	return name
		.toLowerCase()
		.replace(ILLEGAL_UNICODE_CHARACTERS, "")
		.replace(NONCHARACTERS, "");
}

/**
 * Returns true if the given input is a valid attribute name
 * @param {string} input
 * @return {boolean}
 */
export function isValidAttributeName(input: string): boolean {
	return sanitizeAttributeName(input) === input;
}
