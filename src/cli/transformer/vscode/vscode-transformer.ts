import { isSimpleType, SimpleType, SimpleTypeKind, toSimpleType } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { ComponentDefinition } from "../../../analyze/types/component-definition";
import { ComponentMember } from "../../../analyze/types/component-member";
import { EventDeclaration } from "../../../analyze/types/event-types";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { VscodeHtmlData, HtmlDataAttr, HtmlDataAttrValue, HtmlDataTag } from "./vscode-html-data";

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
	const tags = definitions.map(d => definitionToHtmlDataTag(d, checker));

	const vscodeJson: VscodeHtmlData = {
		version: 1,
		tags,
		globalAttributes: [],
		valueSets: []
	};

	return JSON.stringify(vscodeJson, null, 2);
}

function definitionToHtmlDataTag(definition: ComponentDefinition, checker: TypeChecker): HtmlDataTag {
	// Transform all members into "attributes"
	const attributes = definition.declaration.members.map(d => componentMemberToVscodeAttr(d, checker)).filter((val): val is NonNullable<typeof val> => val != null);
	const eventAttributes = definition.declaration.events.map(componentEventToVscodeAttr).filter((val): val is NonNullable<typeof val> => val != null);

	return {
		name: definition.tagName,
		description: definition.declaration.jsDoc && definition.declaration.jsDoc.comment,
		attributes: [...attributes, ...eventAttributes]
	};
}

function componentEventToVscodeAttr(event: EventDeclaration): HtmlDataAttr | undefined {
	return {
		name: `on${event.name}`,
		description: (event.jsDoc && event.jsDoc.comment) || undefined
	};
}

function componentMemberToVscodeAttr(member: ComponentMember, checker: TypeChecker): HtmlDataAttr | undefined {
	switch (member.kind) {
		case "attribute":
		case "property":
			if (member.attrName == null) {
				return undefined;
			}

			return {
				name: member.attrName,
				description: (member.jsDoc && member.jsDoc.comment) || undefined,
				...(typeToVscodeValuePart(member.type, checker) || {})
			};
		case "method":
			return undefined;
	}
}

/**
 * Converts a type to either a value set or string unions.
 * @param type
 * @param checker
 */
function typeToVscodeValuePart(type: SimpleType | Type, checker: TypeChecker): { valueSet: "v" } | { values: HtmlDataAttrValue[] } | undefined {
	const simpleType = isSimpleType(type) ? type : toSimpleType(type, checker);

	switch (simpleType.kind) {
		case SimpleTypeKind.BOOLEAN:
			return { valueSet: "v" };
		case SimpleTypeKind.STRING_LITERAL:
			return { values: [{ name: simpleType.value }] };
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
function typesToStringUnion(types: SimpleType[]): HtmlDataAttrValue[] {
	return types
		.map(t => {
			switch (t.kind) {
				case SimpleTypeKind.STRING_LITERAL:
				case SimpleTypeKind.NUMBER_LITERAL:
					return { name: t.value.toString() };
				default:
					return undefined;
			}
		})
		.filter((val): val is NonNullable<typeof val> => val != null);
}
