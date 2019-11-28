import { SimpleType, toTypeString } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentCssPart } from "../../analyze/types/features/component-css-part";
import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { ComponentSlot } from "../../analyze/types/features/component-slot";
import { JsDoc } from "../../analyze/types/js-doc";
import { arrayFlat } from "../../util/array-util";
import { filterVisibility } from "../../util/model-util";
import { AnalyzeTransformer } from "../transformer";
import { TransformerConfig } from "../transformer-config";
import {
	HtmlData,
	HtmlDataAttribute,
	HtmlDataCssPart,
	HtmlDataCssProperty,
	HtmlDataEvent,
	HtmlDataProperty,
	HtmlDataSlot,
	HtmlDataTag
} from "./custom-elements-json-data";

/**
 * Transforms results to json.
 * @param results
 * @param program
 * @param config
 */
export const jsonTransformer: AnalyzeTransformer = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();

	// Get all definitions
	const definitions = arrayFlat(results.map(res => res.componentDefinitions));

	// Transform all definitions into "tags"
	const tags = definitions.map(d => definitionToHtmlDataTag(d, checker, config));

	const htmlData: HtmlData = {
		version: 2,
		tags
	};

	return JSON.stringify(htmlData, null, 2);
};

function definitionToHtmlDataTag(definition: ComponentDefinition, checker: TypeChecker, config: TransformerConfig): HtmlDataTag {
	const declaration = definition.declaration();

	const attributes = filterVisibility(config.visibility, declaration.members)
		.map(d => componentMemberToHtmlDataAttribute(d, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const properties = filterVisibility(config.visibility, declaration.members)
		.map(d => componentMemberToHtmlDataProperty(d, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const events = filterVisibility(config.visibility, declaration.events)
		.map(e => componentEventToHtmlDataEvent(e, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const slots = declaration.slots.map(e => componentSlotToHtmlDataSlot(e, checker)).filter((val): val is NonNullable<typeof val> => val != null);

	const cssProperties = declaration.cssProperties
		.map(p => componentCssPropToHtmlCssProp(p, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const cssParts = declaration.cssParts
		.map(p => componentCssPropToHtmlCssPart(p, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	return {
		name: definition.tagName,
		description: getDescriptionFromJsDoc(declaration.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(declaration.jsDoc),
		attributes: attributes.length === 0 ? undefined : attributes,
		properties: properties.length === 0 ? undefined : properties,
		events: events.length === 0 ? undefined : events,
		slots: slots.length === 0 ? undefined : slots,
		cssProperties: cssProperties.length === 0 ? undefined : cssProperties,
		cssParts: cssParts.length === 0 ? undefined : cssParts
	};
}

function componentCssPropToHtmlCssProp(prop: ComponentCssProperty, checker: TypeChecker): HtmlDataCssProperty | undefined {
	return {
		name: prop.name || "",
		description: getDescriptionFromJsDoc(prop.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(prop.jsDoc),
		type: prop.type
	};
}

function componentCssPropToHtmlCssPart(part: ComponentCssPart, checker: TypeChecker): HtmlDataCssPart | undefined {
	return {
		name: part.name || "",
		description: getDescriptionFromJsDoc(part.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(part.jsDoc)
	};
}

function componentSlotToHtmlDataSlot(slot: ComponentSlot, checker: TypeChecker): HtmlDataSlot | undefined {
	return {
		name: slot.name || "",
		description: getDescriptionFromJsDoc(slot.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(slot.jsDoc)
	};
}

function componentEventToHtmlDataEvent(event: ComponentEvent, checker: TypeChecker): HtmlDataEvent | undefined {
	return {
		name: event.name,
		description: getDescriptionFromJsDoc(event.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(event.jsDoc)
	};
}

function componentMemberToHtmlDataAttribute(member: ComponentMember, checker: TypeChecker): HtmlDataAttribute | undefined {
	if (member.attrName == null) {
		return undefined;
	}

	return {
		name: member.attrName,
		description: getDescriptionFromJsDoc(member.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
		type: member.typeHint ?? (member.type != null ? getTypeHintFromType(member.type(), checker) : undefined)
	};
}

function componentMemberToHtmlDataProperty(member: ComponentMember, checker: TypeChecker): HtmlDataProperty | undefined {
	switch (member.kind) {
		case "property":
			return {
				name: member.propName,
				attribute: member.attrName,
				description: getDescriptionFromJsDoc(member.jsDoc),
				jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
				type: member.typeHint ?? (member.type != null ? getTypeHintFromType(member.type(), checker) : undefined)
			};
	}

	return undefined;
}

function getDescriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc?.description;
}

function getJsDocTextFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc != null && jsDoc.node != null ? jsDoc.node.getText() : undefined;
}

function getTypeHintFromType(type: Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;

	const typeHint = isTypescriptType(type) ? checker.typeToString(type) : toTypeString(type);
	if (typeHint === "any") return undefined;

	return typeHint;
}

function isTypescriptType(value: any): value is Type {
	return value instanceof Object && "flags" in value && "checker" in value;
}
