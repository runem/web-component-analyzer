import { SimpleType, toTypeString } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { ComponentCSSProperty } from "../../../analyze";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { ComponentCSSPart } from "../../../analyze/types/component-css-part";
import { ComponentDefinition } from "../../../analyze/types/component-definition";
import { ComponentMember } from "../../../analyze/types/component-member";
import { ComponentSlot } from "../../../analyze/types/component-slot";
import { EventDeclaration } from "../../../analyze/types/event-types";
import { JsDoc } from "../../../analyze/types/js-doc";
import { flatten } from "../../util";
import { WcaCliConfig } from "../../wca-cli-arguments";
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
export function jsonTransformer(results: AnalyzeComponentsResult[], program: Program, config: WcaCliConfig): string {
	const checker = program.getTypeChecker();

	// Get all definitions
	const definitions = flatten(results.map(res => res.componentDefinitions));

	// Transform all definitions into "tags"
	const tags = definitions.map(d => definitionToHtmlDataTag(d, checker));

	const htmlData: HtmlData = {
		version: 2,
		tags
	};

	return JSON.stringify(htmlData, null, 2);
}

function definitionToHtmlDataTag(definition: ComponentDefinition, checker: TypeChecker): HtmlDataTag {
	const attributes = definition.declaration.members
		.map(d => componentMemberToHtmlDataAttribute(d, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const properties = definition.declaration.members
		.map(d => componentMemberToHtmlDataProperty(d, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const events = definition.declaration.events
		.map(e => componentEventToHtmlDataEvent(e, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const slots = definition.declaration.slots
		.map(e => componentSlotToHtmlDataSlot(e, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const cssProperties = definition.declaration.cssProperties
		.map(p => componentCssPropToHtmlCssProp(p, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	const cssParts = definition.declaration.cssParts
		.map(p => componentCssPropToHtmlCssPart(p, checker))
		.filter((val): val is NonNullable<typeof val> => val != null);

	return {
		name: definition.tagName,
		description: getDescriptionFromJsDoc(definition.declaration.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(definition.declaration.jsDoc),
		attributes: attributes.length === 0 ? undefined : attributes,
		properties: properties.length === 0 ? undefined : properties,
		events: events.length === 0 ? undefined : events,
		slots: slots.length === 0 ? undefined : slots,
		cssProperties: cssProperties.length === 0 ? undefined : cssProperties,
		cssParts: cssParts.length === 0 ? undefined : cssParts
	};
}

function componentCssPropToHtmlCssProp(prop: ComponentCSSProperty, checker: TypeChecker): HtmlDataCssProperty | undefined {
	return {
		name: prop.name || "",
		description: getDescriptionFromJsDoc(prop.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(prop.jsDoc),
		type: prop.type
	};
}

function componentCssPropToHtmlCssPart(part: ComponentCSSPart, checker: TypeChecker): HtmlDataCssPart | undefined {
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

function componentEventToHtmlDataEvent(event: EventDeclaration, checker: TypeChecker): HtmlDataEvent | undefined {
	return {
		name: event.name,
		description: getDescriptionFromJsDoc(event.jsDoc),
		jsDoc: getJsDocTextFromJsDoc(event.jsDoc)
	};
}

function componentMemberToHtmlDataAttribute(member: ComponentMember, checker: TypeChecker): HtmlDataAttribute | undefined {
	switch (member.kind) {
		case "attribute":
		case "property":
			if (member.attrName == null) {
				return undefined;
			}

			return {
				name: member.attrName,
				description: getDescriptionFromJsDoc(member.jsDoc),
				jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
				type: getJsDocTypeFromType(member.type, checker),
				default: member.default !== undefined ? JSON.stringify(member.default) : undefined,
				required: member.required || undefined
			};
	}

	return undefined;
}

function componentMemberToHtmlDataProperty(member: ComponentMember, checker: TypeChecker): HtmlDataProperty | undefined {
	switch (member.kind) {
		case "property":
			return {
				name: member.propName,
				attribute: member.attrName,
				description: getDescriptionFromJsDoc(member.jsDoc),
				jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
				type: getJsDocTypeFromType(member.type, checker),
				default: member.default !== undefined ? JSON.stringify(member.default) : undefined,
				required: member.required || undefined
			};
	}

	return undefined;
}

function getDescriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc != null ? jsDoc.comment : undefined;
}

function getJsDocTextFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc != null && jsDoc.node != null ? jsDoc.node.getText() : undefined;
}

function getJsDocTypeFromType(type: Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;

	// This function needs to return a jsdoc compatible type representation
	//   but "checker.typeToString" doesn't do that.
	return isTypescriptType(type) ? checker.typeToString(type) : toTypeString(type);
}

function isTypescriptType(value: any): value is Type {
	return value instanceof Object && "flags" in value && "checker" in value;
}
