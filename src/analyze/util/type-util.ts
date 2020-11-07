import { SimpleType, SimpleTypeEnumMember, toSimpleType } from "ts-simple-type";
import * as tsModule from "typescript";
import { Node, Program } from "typescript";

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

// Only search in "lib.dom.d.ts" performance reasons for now
const LIB_FILE_NAMES = ["lib.dom.d.ts"];

// Map "tsModule => name => SimpleType"
const LIB_TYPE_CACHE: WeakMap<typeof tsModule, Map<string, SimpleType | undefined>> = new Map();

/**
 * Return a Typescript library type with a specific name
 * @param name
 * @param ts
 * @param program
 */
export function getLibTypeWithName(name: string, { ts, program }: { program: Program; ts: typeof tsModule }): SimpleType | undefined {
	const nameTypeCache = LIB_TYPE_CACHE.get(ts) || new Map();

	if (nameTypeCache.has(name)) {
		return nameTypeCache.get(name);
	} else {
		LIB_TYPE_CACHE.set(ts, nameTypeCache);
	}

	let node: Node | undefined;

	for (const libFileName of LIB_FILE_NAMES) {
		const sourceFile = program.getSourceFile(libFileName) || program.getSourceFiles().find(f => f.fileName.endsWith(libFileName));
		if (sourceFile == null) {
			continue;
		}

		for (const statement of sourceFile.statements) {
			if (ts.isInterfaceDeclaration(statement) && statement.name?.text === name) {
				node = statement;
				break;
			}
		}

		if (node != null) {
			break;
		}
	}

	const checker = program.getTypeChecker();
	let type = node == null ? undefined : toSimpleType(node, checker);

	if (type != null) {
		// Apparently Typescript wraps the type in "generic arguments" when take the type from the interface declaration
		// Remove "generic arguments" here
		if (type.kind === "GENERIC_ARGUMENTS") {
			type = type.target;
		}
	}

	nameTypeCache.set(name, type);

	return type;
}
