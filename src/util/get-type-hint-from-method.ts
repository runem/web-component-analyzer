import { TypeChecker } from "typescript";
import { ComponentMethod } from "../analyze/types/features/component-method";
import { getTypeHintFromType } from "./get-type-hint-from-type";

/**
 * This method returns a "type hint" that represents the method signature
 * The resulting type takes jsdoc into account.
 * I couldn't find a way for Typescript to return the signature string taking jsdoc into account
 *   so therefore I had to do some regex-magic in this method.
 */
export function getTypeHintFromMethod(method: ComponentMethod, checker: TypeChecker): string | undefined {
	let signature = getTypeHintFromType(method.type?.(), checker, {}) || "";

	// Replace "=>" with ":" and the return type with the returnTypeHint if present
	signature = signature.replace(
		/\)\s*=>\s?(.*)$/,
		`): ${method.jsDoc?.tags?.find(tag => ["returns", "return"].includes(tag.tag))?.parsed().type ?? "$1"}`
	);

	// Replace all "any" types with corresponding type hints
	for (const parameterJsDocTag of method.jsDoc?.tags?.filter(tag => tag.tag === "param") || []) {
		const parsed = parameterJsDocTag.parsed();
		if (parsed.type != null) {
			signature = signature.replace(new RegExp(`${parsed.name}(.*?:\\s*)any\\[?]?`), `${parsed.name}$1${parsed.type}`);
		}
	}

	// Replace "{}" with more pleasant string
	signature = signature.replace("{}", "object");

	return signature;
}
