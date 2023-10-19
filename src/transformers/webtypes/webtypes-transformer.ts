import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { arrayDefined } from "../../util/array-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import {
	HtmlAttribute,
	WebtypesSchema,
	HtmlElement,
	BaseContribution,
	Js,
	GenericJsContribution,
	CssProperty,
	HtmlAttributeValue,
	SlotAttribute
} from "./webtypes-schema";
import { getFirst } from "../../util/set-util";
import { relative } from "path";

interface SourceDescription {
	module: string;
	className: string;
}

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
	const cssProperties = definitions.map(d => definitionToCssProperties(d)).reduce((acc, cur) => [...acc, ...cur], []);

	const webTypeConfig = config.webTypes;

	const webtypesJson: WebtypesSchema = {
		$schema: "http://json.schemastore.org/web-types",
		name: webTypeConfig?.name ?? "",
		version: webTypeConfig?.version ?? "",
		...(webTypeConfig?.framework ? { framework: webTypeConfig?.framework } : {}),
		...(webTypeConfig?.["js-types-syntax"] ? { "js-types-syntax": webTypeConfig?.["js-types-syntax"] } : {}),
		...(webTypeConfig?.["default-icon"] ? { "default-icon": webTypeConfig?.["default-icon"] } : {}),
		...(webTypeConfig?.["framework-config"] ? { "framework-config": webTypeConfig?.["framework-config"] } : {}),
		...(webTypeConfig?.["description-markup"] ? { "description-markup": webTypeConfig?.["description-markup"] } : {}),
		contributions: {
			html: {
				elements: elements
			},
			css: {
				properties: cssProperties
			}
		}
	};

	return JSON.stringify(webtypesJson, null, 4);
};

function definitionToCssProperties(definition: ComponentDefinition): CssProperty[] {
	if (!definition.declaration) return [];

	return arrayDefined(definition.declaration.cssProperties.map(e => componentCssPropertiesToAttr(e)));
}

function definitionToHTMLElement(definition: ComponentDefinition, checker: TypeChecker, config: TransformerConfig): HtmlElement {
	const declaration = definition.declaration;

	if (declaration == null) {
		return {
			name: definition.tagName,
			attributes: []
		};
	}

	const build: HtmlElement = {
		name: definition.tagName,
		...(declaration.deprecated !== undefined ? { deprecated: true } : {})
	};

	// Build description
	if (declaration?.jsDoc?.description) build.description = declaration.jsDoc.description;

	// Build source section
	const node = getFirst(definition.identifierNodes);
	const path = getRelativePath(node?.getSourceFile().fileName, config);

	let sourceDescription: SourceDescription | null = null;
	if (node?.getText() && path) {
		build.source = {
			module: path,
			symbol: node.getText()
		};
		sourceDescription = {
			module: path,
			className: node.getText()
		};
	}

	// Build attributes
	const customElementAttributes = arrayDefined(
		declaration.members.map(d => componentMemberToAttr(d.attrName, d, sourceDescription, checker, config))
	);
	if (customElementAttributes.length > 0) build.attributes = customElementAttributes;

	const js: Js = {};

	// Build properties
	const customElementProperties = arrayDefined(
		declaration.members.map(d => componentMemberToAttr(d.propName, d, sourceDescription, checker, config))
	);
	if (customElementProperties.length > 0) js.properties = customElementProperties;

	// Build events
	const eventAttributes = arrayDefined(declaration.events.map(e => componentEventToAttr(e)));
	if (eventAttributes.length > 0) js.events = eventAttributes;

	if (js.properties || js.events) build.js = js;

	// Build slots
	const slots: SlotAttribute[] = declaration.slots?.map(slot => ({
		name: slot.name || "",
		description: slot.jsDoc?.description || ""
	}));
	if (slots && slots.length > 0) {
		slots.forEach(slot => {
			if (slot.name == "") slot.priority = "low";
		});
		build.slots = slots;
	}

	return build;
}

function getRelativePath(fileName: string | undefined, config: TransformerConfig): string | undefined {
	return fileName != null && config.cwd != null
		? `${config.webTypes?.pathAsAbsolute ? "" : "./"}${relative(config.cwd, fileName)}`.replaceAll("\\", "/")
		: undefined;
}

function componentEventToAttr(event: ComponentEvent): GenericJsContribution {
	const builtEvent: GenericJsContribution = {
		name: event.name
	};

	if (event?.jsDoc?.description) builtEvent.description = event.jsDoc.description;

	return builtEvent;
}

function componentCssPropertiesToAttr(cssProperty: ComponentCssProperty): CssProperty {
	const builtCssProp: CssProperty = {
		name: cssProperty.name
	};

	if (cssProperty?.jsDoc?.description) builtCssProp.description = cssProperty.jsDoc.description;

	return builtCssProp;
}

function componentMemberToAttr(
	propName: string | undefined,
	member: ComponentMember,
	sourceDescription: SourceDescription | null,
	checker: TypeChecker,
	config: TransformerConfig
): BaseContribution | undefined {
	if (propName == null) {
		return undefined;
	}

	const types: string[] | string = getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config)?.split(" | ") ?? [];
	const isPlainEnum = types.every(t => t == "null" || t == "undefined" || t.trim().match(/^["'].*["']$/));
	const typeValues: Partial<HtmlAttributeValue> = isPlainEnum
		? {
				kind: "plain",
				type: types.join(" | ")
		  }
		: {
				type: types && Array.isArray(types) && types.length == 1 ? types[0] : types
		  };

	const attr: HtmlAttribute = {
		name: propName,
		required: !!member.required,
		priority: member.visibility == "private" || member.visibility == "protected" ? "lowest" : "normal",
		value: {
			...typeValues,
			required: !isBoolean(types),
			...(member.default !== undefined ? { default: JSON.stringify(member.default) } : {})
		},
		...(member.deprecated !== undefined ? { deprecated: true } : {})
	};

	if (member?.jsDoc?.description) attr.description = member.jsDoc.description;

	if (sourceDescription !== null) {
		attr.source = {
			module: sourceDescription.module,
			symbol: sourceDescription.className + "." + member.propName
		};
	}

	return attr;
}

function isBoolean(type: string | string[]): boolean {
	if (Array.isArray(type)) return type.some(t => t && t.toLowerCase().includes("boolean"));

	return type ? type.toLowerCase().includes("boolean") : false;
}
