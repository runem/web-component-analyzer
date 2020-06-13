import { SimpleType, SimpleTypeEnumMember } from "ts-simple-type";

/**
 * Relax the type so that for example "string literal" become "string" and "function" become "any"
 * This is used for javascript files to provide type checking with Typescript type inferring
 * @param type
 */
export function relaxType(type: SimpleType): SimpleType {
	switch (type.kind) {
		case "INTERSECTION":
		case "UNION":
			return {
				...type,
				types: type.types.map(t => relaxType(t))
			};

		case "ENUM":
			return {
				...type,
				types: type.types.map(t => relaxType(t) as SimpleTypeEnumMember)
			};

		case "ARRAY":
			return {
				...type,
				type: relaxType(type.type)
			};

		case "PROMISE":
			return {
				...type,
				type: relaxType(type.type)
			};

		case "OBJECT":
			return {
				name: type.name,
				kind: "OBJECT"
			};
		case "INTERFACE":
		case "FUNCTION":
		case "CLASS":
			return {
				name: type.name,
				kind: "ANY"
			};

		case "NUMBER_LITERAL":
			return { kind: "NUMBER" };
		case "STRING_LITERAL":
			return { kind: "STRING" };
		case "BOOLEAN_LITERAL":
			return { kind: "BOOLEAN" };
		case "BIG_INT_LITERAL":
			return { kind: "BIG_INT" };

		case "ENUM_MEMBER":
			return {
				...type,
				type: relaxType(type.type)
			} as SimpleTypeEnumMember;

		case "ALIAS":
			return {
				...type,
				target: relaxType(type.target)
			};

		case "NULL":
		case "UNDEFINED":
			return { kind: "ANY" };

		default:
			return type;
	}
}
