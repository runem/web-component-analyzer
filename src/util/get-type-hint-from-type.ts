import { SimpleType, toTypeString } from "ts-simple-type";
import { Type, TypeChecker } from "typescript";

/**
 * Returns a "type hint" from a type
 * The type hint is an easy to read representation of the type and is not made for being parsed.
 * @param type
 * @param checker
 */
export function getTypeHintFromType(type: string | Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;
	if (typeof type === "string") return type;

	const typeHint = toTypeString(type, checker);

	// Replace "anys" and "{}" with more human friendly representations
	if (typeHint === "any") return undefined;
	if (typeHint === "any[]") return "array";
	if (typeHint === "{}") return "object";

	return typeHint;
}
