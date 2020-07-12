import { SimpleType, toSimpleType } from "ts-simple-type";
import * as tsModule from "typescript";
import { Node, Program } from "typescript";

// Only search in "lib.dom.d.ts" performance reasons for now
const LIB_FILE_NAMES = ["lib.dom.d.ts"];

const LIB_TYPE_CACHE = new Map<string, SimpleType | undefined>();

/**
 * Return a Typescript library type with a specific name
 * @param name
 * @param ts
 * @param program
 */
export function getLibTypeWithName(name: string, { ts, program }: { program: Program; ts: typeof tsModule }): SimpleType | undefined {
	if (LIB_TYPE_CACHE.has(name)) {
		return LIB_TYPE_CACHE.get(name);
	}

	let node: Node | undefined;

	for (const libFileName of LIB_FILE_NAMES) {
		const sourceFile = program.getSourceFile(libFileName);
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

	LIB_TYPE_CACHE.set(name, type);

	return type;
}
