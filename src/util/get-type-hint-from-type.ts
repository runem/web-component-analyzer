import { isSimpleType, SimpleType, SimpleTypeAlias, SimpleTypeKind, simpleTypeToString, toTypeString } from "ts-simple-type";
import { Type, TypeChecker, TypeFormatFlags } from "typescript";
import { TransformerConfig } from "../transformers/transformer-config";

/**
 * Returns a "type hint" from a type
 * The type hint is an easy to read representation of the type and is not made for being parsed.
 * @param type
 * @param checker
 * @param config
 */
export function getTypeHintFromType(
	type: string | Type | SimpleType | undefined,
	checker: TypeChecker,
	config: TransformerConfig
): string | undefined {
	if (type == null) return undefined;
	if (typeof type === "string") return type;

	let typeHint: string;

	if (config.inlineTypes) {
		// Inline aliased types
		if (isSimpleType(type)) {
			// Expand a possible alias
			if (isUnionTypeAlias(type)) {
				type = type.target;
			}

			typeHint = simpleTypeToString(type);
		} else {
			// Transform using Typescript natively, to avoid transforming all types to simple types (overhead).
			// The "InTypeAlias" flag expands the type.
			typeHint = checker.typeToString(type, undefined, TypeFormatFlags.InTypeAlias);
		}
	} else {
		// Transform types to string
		typeHint = toTypeString(type, checker);
	}

	// Replace "anys" and "{}" with more human friendly representations
	if (typeHint === "any") return undefined;
	if (typeHint === "any[]") return "array";
	if (typeHint === "{}") return "object";

	return typeHint;
}

/**
 * Checks if a type is a type alias simple type
 * @param simpleType
 */
function isUnionTypeAlias(simpleType: SimpleType): simpleType is SimpleTypeAlias {
	return simpleType.kind === SimpleTypeKind.ALIAS && simpleType.target.kind === SimpleTypeKind.UNION;
}
