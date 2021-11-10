import { getTypeHintFromMethod } from "../../util/get-type-hint-from-method";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
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
import { GenericContributionsHost, WebtypesSchema } from "./webtypes-schema";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const webtypesTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();

	// Grab all definitions
	const definitions = results.map(res => res.componentDefinitions).reduce((acc, cur) => [...acc, ...cur], []);

	// Transform all definitions into "tags"
	const elements = definitions.map(d => definitionToHTMLElement(d, checker, config));

	const webtypesJson: WebtypesSchema = {
		$schema: "https://raw.githubusercontent.com/JetBrains/web-types/master/v2-preview/web-types.json",
		name: "web-components", // TODO as param
		version: "experimental",
		//"default-icon": "icons/lit.png",
		"js-types-syntax": "typescript", // TODO as param
		framework: "lit",
		"framework-config": {
			"enable-when": {
				"node-packages": ["lit"],
				"file-extensions": ["ts", "js", "tsx", "jsx"]
			}
		},
		contributions: {
			html: {
				elements: elements
				/*
				attributes: [
					{
						"name": "Event listeners",
						"description": "Event listeners expression",
						"doc-url": "https://lit.dev/docs/templates/expressions/#event-listener-expressions",
						"value": {
							"kind": "expression",
							"type": "(event: Event) => void"
						},
						"pattern": {
							"items": "/html/events",
							"template": [
								"@",
								"#item:event name"
							]
						}
					},
					{
						"name": "Boolean Attributes",
						"description": "Boolean Attributes expression",
						"doc-url": "https://lit.dev/docs/templates/expressions/#boolean-attribute-expressions",
						"value": {
							"kind": "expression",
							"type": "boolean"
						},
						"pattern": {
							"items": "/html/attributes",
							"template": [
								"?",
								"#item:attribute name"
							]
						}
					},
					{
						"name": "Properties",
						"description": "Properties expression",
						"doc-url": "https://lit.dev/docs/templates/expressions/#property-expressions",
						"value": {
							"kind": "expression",
							"type": "any"
						},
						"pattern": {
							"items": "/html/attributes",
							"template": [
								".",
								"#item:property name"
							]
						}
					}
				]
				 */
			}
		}
	};

	return JSON.stringify(webtypesJson, null, 4);
};

function definitionToHTMLElement(definition: ComponentDefinition, checker: TypeChecker, config: TransformerConfig): GenericContributionsHost {
	const declaration = definition.declaration;

	if (declaration == null) {
		return {
			name: definition.tagName,
			attributes: []
		};
	}

	/*
	// Transform all members into "attributes"
	const customElementAttributes = arrayDefined(declaration.members.map(d => componentMemberToVscodeAttr(d, checker)));
	const eventAttributes = arrayDefined(declaration.events.map(e => componentEventToVscodeAttr(e, checker)));

	const attributes = [...customElementAttributes, ...eventAttributes];
*/
	const customElementAttributes = arrayDefined(declaration.members.map(d => componentMemberToAttr(d, checker, config)));
	const eventAttributes = arrayDefined(declaration.events.map(e => componentEventToAttr(e, checker, config)));

	const attributes = [...customElementAttributes, ...eventAttributes];

	return {
		name: definition.tagName,
		/*
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
*/
		attributes: attributes
	};
}

function componentEventToAttr(event: ComponentEvent, checker: TypeChecker, config: TransformerConfig): GenericContributionsHost | undefined {
	return {
		name: `@${event.name}`
	};
}

function componentMemberToAttr(member: ComponentMember, checker: TypeChecker, config: TransformerConfig): GenericContributionsHost | undefined {
	if (member.propName == null) {
		return undefined;
	}

	const isFunction = member.attrName == null;

	let types: string[] | string = getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config)?.split(" | ") ?? [];
	if (isFunction) {
		types = []; // TODO find a way to support function signatures, types includes signature as string
	}

	let name = member.propName;
	if (isFunction || types.length == 0 || types.includes("Object")) {
		name = "." + name;
	} else if (types.length == 1 && types.includes("boolean")) {
		name = "?" + name;
	}

	if (types.length == 1) {
		types = types[0];
	}

	return {
		name: name,
		value: {
			type: types,
			required: new Boolean(member.required).valueOf()
			//default: member.default // TODO has some strange values
		}
		/*
		description: formatMetadata(formatEntryRow(member.attrName, member.jsDoc, member.typeHint || member.type?.(), checker), {
			Property: "propName" in member ? member.propName : undefined,
			Default: member.default === undefined ? undefined : String(member.default)
		}),
		...((member.type && typeToVscodeValuePart(member.type?.(), checker)) || {})
*/
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
