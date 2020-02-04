import { SimpleType, isSimpleType, toSimpleType, SimpleTypeKind, simpleTypeToString, SimpleTypeAlias } from "ts-simple-type";
import { Type, TypeChecker } from "typescript";

function isStringLiteralsUnionAlias(simpleType: SimpleType): simpleType is SimpleTypeAlias {
	if (simpleType.kind === SimpleTypeKind.ALIAS && simpleType.target.kind === SimpleTypeKind.UNION) {
		return simpleType.target.types.every(unionType => unionType.kind === SimpleTypeKind.STRING_LITERAL);
	}
	return false;
}

/**
 * Returns a "type hint" from a type
 * The type hint is an easy to read representation of the type and is not made for being parsed.
 * @param type
 * @param checker
 */
export function getTypeHintFromType(type: string | Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;
	if (typeof type === "string") return type;

	let simpleType: SimpleType = isSimpleType(type) ? type : toSimpleType(type, checker);
	if (isStringLiteralsUnionAlias(simpleType)) {
		simpleType = simpleType.target;
	}
	const typeHint = simpleTypeToString(simpleType);

	// Replace "anys" and "{}" with more human friendly representations
	if (typeHint === "any") return undefined;
	if (typeHint === "any[]") return "array";
	if (typeHint === "{}") return "object";

	return typeHint;
}
