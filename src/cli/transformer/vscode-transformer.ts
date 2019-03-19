import { isSimpleType, SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzeComponentsResult } from "../../analyze/analyze-components";
import { ComponentMemberAttribute } from "../../analyze/types/component-member";
import { WcaCliConfig } from "../wca-cli-arguments";

/**
 * Vscode json output format transformer.
 * @param results
 * @param program
 * @param config
 */
export function vscodeTransformer(results: AnalyzeComponentsResult[], program: Program, config: WcaCliConfig): string {
	const checker = program.getTypeChecker();

	// Grab all definitions
	const definitions = results.map(res => res.componentDefinitions).reduce((acc, cur) => [...acc, ...cur], []);

	// Transform all definitions into "tags"
	const tags = definitions.map(definition => {
		// Transform all members into "attributes"
		const attributes = definition.declaration.members
			.filter((member): member is ComponentMemberAttribute => member.kind === "attribute")
			.map(attr => ({
				name: attr.attrName,
				description: (attr.jsDoc && attr.jsDoc.comment) || undefined,
				...(typeToVscodeValuePart(attr.type, checker) || {})
			}));

		return {
			name: definition.tagName,
			description: definition.declaration.jsDoc && definition.declaration.jsDoc.comment,
			attributes
		};
	});

	const vscodeJson = {
		version: 1,
		tags,
		globalAttributes: [],
		valueSets: []
	};

	return JSON.stringify(vscodeJson, null, 2);
}

/**
 * Converts a type to either a value set or string unions.
 * @param type
 * @param checker
 */
function typeToVscodeValuePart(type: SimpleType | Type, checker: TypeChecker): { valueSet: "v" } | { values: string[] } | undefined {
	const simpleType = isSimpleType(type) ? type : toSimpleType(type, checker);

	switch (simpleType.kind) {
		case SimpleTypeKind.BOOLEAN:
			return { valueSet: "v" };
		case SimpleTypeKind.STRING_LITERAL:
			return { values: [simpleType.value] };
		case SimpleTypeKind.ENUM:
			return { values: typesToStringUnion(simpleType.types.map(({ type }) => type)) };
		case SimpleTypeKind.UNION:
			return { values: typesToStringUnion(simpleType.types) };
	}

	return undefined;
}

/**
 * Returns a list of strings that represents the types.
 * Only looks at literal types and strips the rest.
 * @param types
 */
function typesToStringUnion(types: SimpleType[]): string[] {
	return types
		.map(t => {
			switch (t.kind) {
				case SimpleTypeKind.STRING_LITERAL:
				case SimpleTypeKind.NUMBER_LITERAL:
					return t.value.toString();
				default:
					return undefined;
			}
		})
		.filter((val): val is NonNullable<typeof val> => val != null);
}
