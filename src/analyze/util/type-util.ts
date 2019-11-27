import { SimpleType, SimpleTypeEnumMember, SimpleTypeKind } from "ts-simple-type";

/**
 * Relax the type so that for example "string literal" become "string" and "function" become "any"
 * This is used for javascript files to provide type checking with Typescript type inferring
 * @param type
 */
export function relaxType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case SimpleTypeKind.INTERSECTION:
		case SimpleTypeKind.UNION:
			return {
				...type,
				types: type.types.map(t => relaxType(t))
			};

		case SimpleTypeKind.ENUM:
			return {
				...type,
				types: type.types.map(t => relaxType(t) as SimpleTypeEnumMember)
			};

		case SimpleTypeKind.ARRAY:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.PROMISE:
			return {
				...type,
				type: relaxType(type.type)
			};

		case SimpleTypeKind.OBJECT:
			return {
				name: type.name,
				kind: SimpleTypeKind.OBJECT
			};
		case SimpleTypeKind.INTERFACE:
		case SimpleTypeKind.FUNCTION:
		case SimpleTypeKind.CLASS:
			return {
				name: type.name,
				kind: SimpleTypeKind.ANY
			};

		case SimpleTypeKind.NUMBER_LITERAL:
			return { kind: SimpleTypeKind.NUMBER };
		case SimpleTypeKind.STRING_LITERAL:
			return { kind: SimpleTypeKind.STRING };
		case SimpleTypeKind.BOOLEAN_LITERAL:
			return { kind: SimpleTypeKind.BOOLEAN };
		case SimpleTypeKind.BIG_INT_LITERAL:
			return { kind: SimpleTypeKind.BIG_INT };

		case SimpleTypeKind.ENUM_MEMBER:
			return {
				...type,
				type: relaxType(type.type)
			} as SimpleTypeEnumMember;

		case SimpleTypeKind.ALIAS:
			return {
				...type,
				target: relaxType(type.target)
			};

		case SimpleTypeKind.NULL:
		case SimpleTypeKind.UNDEFINED:
			return { kind: SimpleTypeKind.ANY };

		default:
			return type;
	}
}
