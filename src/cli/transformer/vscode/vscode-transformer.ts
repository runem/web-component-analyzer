import { isAssignableToSimpleTypeKind, isSimpleType, SimpleType, SimpleTypeKind, toSimpleType, toTypeString } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { ComponentDefinition } from "../../../analyze/types/component-definition";
import { ComponentMember } from "../../../analyze/types/component-member";
import { EventDeclaration } from "../../../analyze/types/event-types";
import { JsDoc } from "../../../analyze/types/js-doc";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { markdownHighlight } from "../util/markdown-util";
import { HtmlDataAttr, HtmlDataAttrValue, HtmlDataTag, VscodeHtmlData } from "./vscode-html-data";

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
	const customElementAttributes = definition.declaration.members
		.map(d => componentMemberToVscodeAttr(d, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);
	const eventAttributes = definition.declaration.events
		.map(e => componentEventToVscodeAttr(e, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const attributes = [...customElementAttributes, ...eventAttributes];

	return {
		name: definition.tagName,
		description: formatMetadata(definition.declaration.jsDoc, {
			Events: definition.declaration.events.map(e => formatEntryRow(e.name, e.jsDoc, e.type, checker)),
			Slots: definition.declaration.slots.map(s =>
				formatEntryRow(s.name || " ", s.jsDoc, s.permittedTagNames && s.permittedTagNames.map(n => `"${markdownHighlight(n)}"`).join(" | "), checker)
			),
			Attributes: definition.declaration.members
				.map(m => ("attrName" in m && m.attrName != null ? formatEntryRow(m.attrName, m.jsDoc, m.type, checker) : undefined))
				.filter(m => m != null),
			Properties: definition.declaration.members
				.map(m => ("propName" in m && m.propName != null ? formatEntryRow(m.propName, m.jsDoc, m.type, checker) : undefined))
				.filter(m => m != null)
		}),
		attributes
	};
}

function componentEventToVscodeAttr(event: EventDeclaration, checker: TypeChecker): HtmlDataAttr | undefined {
	return {
		name: `on${event.name}`,
		description: formatEntryRow(event.name, event.jsDoc, event.type, checker)
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
				description: formatMetadata(formatEntryRow(member.attrName, member.jsDoc, member.type, checker), {
					Property: "propName" in member ? member.propName : undefined,
					Default: member.default === undefined ? undefined : String(member.default)
				}),
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

/**
 * Formats description and metadata so that it can be used in documentation.
 * @param doc
 * @param metadata
 */
function formatMetadata(
	doc: string | undefined | JsDoc,
	metadata: { [key: string]: string | undefined | (string | undefined)[] }
): string | undefined {
	const metaText = Object.entries(metadata)
		.map(([key, value]) => {
			if (value == null) {
				return undefined;
			} else if (Array.isArray(value)) {
				const filtered = value.filter((v): v is NonNullable<typeof v> => v != null);
				if (filtered.length === 0) return undefined;

				return `${key}:\n\n${filtered.map(v => `  * ${v}`).join(`\n\n`)}`;
			} else if (typeof value === "string") {
				return `${key}: ${value}`;
			}
		})
		.filter((value): value is NonNullable<typeof value> => value != null)
		.join(`\n\n`);

	const comment = doc == null ? undefined : typeof doc === "string" ? doc : doc.comment && doc.comment;

	return `${comment || ""}${metadata ? `${comment ? `\n\n` : ""}${metaText}` : ""}` || undefined;
}

/**
 * Formats name, doc and type so that it can be presented in documentation
 * @param name
 * @param doc
 * @param type
 * @param checker
 */
function formatEntryRow(name: string, doc: JsDoc | string | undefined, type: Type | SimpleType | string | undefined, checker: TypeChecker): string {
	const comment = doc == null ? undefined : typeof doc === "string" ? doc : doc.comment && doc.comment;
	const typeText = type == null ? undefined : typeof type === "string" ? type : formatType(type, checker);

	return `${markdownHighlight(name)}${typeText == null ? "" : ` \{${typeText}\}`}${comment == null ? "" : " - "}${comment || ""}`;
}

/**
 * Formats a type to present in documentation
 * @param type
 * @param checker
 */
function formatType(type: Type | SimpleType, checker: TypeChecker): string | undefined {
	return !isAssignableToSimpleTypeKind(type, SimpleTypeKind.ANY, checker) ? markdownHighlight(toTypeString(type, checker)) : undefined;
}
