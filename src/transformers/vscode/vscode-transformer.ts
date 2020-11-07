import { isAssignableToSimpleTypeKind, isSimpleType, SimpleType, toSimpleType, typeToString } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { JsDoc } from "../../analyze/types/js-doc";
import { arrayDefined } from "../../util/array-util";
import { markdownHighlight } from "../markdown/markdown-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import { HtmlDataAttr, HtmlDataAttrValue, HtmlDataTag, VscodeHtmlData } from "./vscode-html-data";

/**
 * Vscode json output format transformer.
 * @param results
 * @param program
 * @param config
 */
export const vscodeTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
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
};

function definitionToHtmlDataTag(definition: ComponentDefinition, checker: TypeChecker): HtmlDataTag {
	const declaration = definition.declaration;

	if (declaration == null) {
		return {
			name: definition.tagName,
			attributes: []
		};
	}

	// Transform all members into "attributes"
	const customElementAttributes = arrayDefined(declaration.members.map(d => componentMemberToVscodeAttr(d, checker)));
	const eventAttributes = arrayDefined(declaration.events.map(e => componentEventToVscodeAttr(e, checker)));

	const attributes = [...customElementAttributes, ...eventAttributes];

	return {
		name: definition.tagName,
		description: formatMetadata(declaration.jsDoc, {
			Events: declaration.events.map(e => formatEntryRow(e.name, e.jsDoc, e.type?.(), checker)),
			Slots: declaration.slots.map(s =>
				formatEntryRow(s.name || " ", s.jsDoc, s.permittedTagNames && s.permittedTagNames.map(n => `"${markdownHighlight(n)}"`).join(" | "), checker)
			),
			Attributes: declaration.members
				.map(m => ("attrName" in m && m.attrName != null ? formatEntryRow(m.attrName, m.jsDoc, m.typeHint || m.type?.(), checker) : undefined))
				.filter(m => m != null),
			Properties: declaration.members
				.map(m => ("propName" in m && m.propName != null ? formatEntryRow(m.propName, m.jsDoc, m.typeHint || m.type?.(), checker) : undefined))
				.filter(m => m != null)
		}),
		attributes
	};
}

function componentEventToVscodeAttr(event: ComponentEvent, checker: TypeChecker): HtmlDataAttr | undefined {
	return {
		name: `on${event.name}`,
		description: formatEntryRow(event.name, event.jsDoc, event.type?.(), checker)
	};
}

function componentMemberToVscodeAttr(member: ComponentMember, checker: TypeChecker): HtmlDataAttr | undefined {
	if (member.attrName == null) {
		return undefined;
	}

	return {
		name: member.attrName,
		description: formatMetadata(formatEntryRow(member.attrName, member.jsDoc, member.typeHint || member.type?.(), checker), {
			Property: "propName" in member ? member.propName : undefined,
			Default: member.default === undefined ? undefined : String(member.default)
		}),
		...((member.type && typeToVscodeValuePart(member.type?.(), checker)) || {})
	};
}

/**
 * Converts a type to either a value set or string unions.
 * @param type
 * @param checker
 */
function typeToVscodeValuePart(type: SimpleType | Type, checker: TypeChecker): { valueSet: "v" } | { values: HtmlDataAttrValue[] } | undefined {
	const simpleType = isSimpleType(type) ? type : toSimpleType(type, checker);

	switch (simpleType.kind) {
		case "BOOLEAN":
			return { valueSet: "v" };
		case "STRING_LITERAL":
			return { values: [{ name: simpleType.value }] };
		case "ENUM":
			return { values: typesToStringUnion(simpleType.types.map(({ type }) => type)) };
		case "UNION":
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
	return arrayDefined(
		types.map(t => {
			switch (t.kind) {
				case "STRING_LITERAL":
				case "NUMBER_LITERAL":
					return { name: t.value.toString() };
				default:
					return undefined;
			}
		})
	);
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
	const metaText = arrayDefined(
		Object.entries(metadata).map(([key, value]) => {
			if (value == null) {
				return undefined;
			} else if (Array.isArray(value)) {
				const filtered = arrayDefined(value);
				if (filtered.length === 0) return undefined;

				return `${key}:\n\n${filtered.map(v => `  * ${v}`).join(`\n\n`)}`;
			} else {
				return `${key}: ${value}`;
			}
		})
	).join(`\n\n`);

	const comment = typeof doc === "string" ? doc : doc?.description || "";

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
	const comment = typeof doc === "string" ? doc : doc?.description || "";
	const typeText = typeof type === "string" ? type : type == null ? "" : formatType(type, checker);

	return `${markdownHighlight(name)}${typeText == null ? "" : ` {${typeText}}`}${comment == null ? "" : " - "}${comment || ""}`;
}

/**
 * Formats a type to present in documentation
 * @param type
 * @param checker
 */
function formatType(type: Type | SimpleType, checker: TypeChecker): string | undefined {
	return !isAssignableToSimpleTypeKind(type, "ANY", checker) ? markdownHighlight(typeToString(type, checker)) : undefined;
}
