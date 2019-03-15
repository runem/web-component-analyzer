import { isAssignableToSimpleTypeKind, isSimpleTypePrimitive, SimpleType, SimpleTypeKind } from "ts-simple-type";

/**
 * Returns a more general type for a given type.
 * @param simpleType
 */
export function getGeneralType(simpleType: SimpleType) {
	if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.ARRAY)) {
		return { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.STRING) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.STRING_LITERAL)) {
		return { kind: SimpleTypeKind.STRING } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.NUMBER) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.NUMBER_LITERAL)) {
		return { kind: SimpleTypeKind.NUMBER } as SimpleType;
	} else if (isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.BOOLEAN) || isAssignableToSimpleTypeKind(simpleType, SimpleTypeKind.BOOLEAN_LITERAL)) {
		return { kind: SimpleTypeKind.BOOLEAN } as SimpleType;
	} else if (!isSimpleTypePrimitive(simpleType)) {
		return { kind: SimpleTypeKind.OBJECT } as SimpleType;
	}
	return { kind: SimpleTypeKind.ANY } as SimpleType;
}
