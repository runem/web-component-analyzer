import { SimpleType, isSimpleType, SimpleTypeKind, simpleTypeToString, SimpleTypeAlias } from "ts-simple-type";
import { Type, TypeChecker, TypeFormatFlags } from "typescript";

function isUnionTypeAlias(simpleType: SimpleType): simpleType is SimpleTypeAlias {
	return simpleType.kind === SimpleTypeKind.ALIAS && simpleType.target.kind === SimpleTypeKind.UNION;
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

	let typeHint = "";
	if (isSimpleType(type)) {
		if (isUnionTypeAlias(type)) {
			type = type.target;
		}
		typeHint = simpleTypeToString(type);
	} else {
		typeHint = checker.typeToString(type, undefined, TypeFormatFlags.InTypeAlias);
	}

	// Replace "anys" and "{}" with more human friendly representations
	if (typeHint === "any") return undefined;
	if (typeHint === "any[]") return "array";
	if (typeHint === "{}") return "object";

	return typeHint;
}
