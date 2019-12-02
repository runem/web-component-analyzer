import { SimpleType, toTypeString } from "ts-simple-type";
import { Type, TypeChecker } from "typescript";

export function getTypeHintFromType(type: string | Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;
	if (typeof type === "string") return type;

	const typeHint = toTypeString(type, checker);
	if (typeHint === "any") return undefined;
	if (typeHint === "any[]") return "array";
	if (typeHint === "{}") return "object";

	return typeHint;
}
