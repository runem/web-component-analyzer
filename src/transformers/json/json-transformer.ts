import { relative } from "path";
import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentDefinition } from "../../analyze/types/component-definition";
import { ComponentCssPart } from "../../analyze/types/features/component-css-part";
import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentMember } from "../../analyze/types/features/component-member";
import { ComponentSlot } from "../../analyze/types/features/component-slot";
import { JsDoc } from "../../analyze/types/js-doc";
import { arrayDefined, arrayFlat } from "../../util/array-util";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
import { getFirst } from "../../util/set-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
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
export const jsonTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	const checker = program.getTypeChecker();

	// Get all definitions
	const definitions = arrayFlat(results.map(res => res.componentDefinitions));

	// Transform all definitions into "tags"
	const tags = definitions.map(d => definitionToHtmlDataTag(d, checker, config));

	const htmlData: HtmlData = {
		version: "experimental",
		tags
	};

	return JSON.stringify(htmlData, null, 2);
};

function definitionToHtmlDataTag(definition: ComponentDefinition, checker: TypeChecker, config: TransformerConfig): HtmlDataTag {
	const declaration = definition.declaration();

	// Grab path to the definition file if possible
	const node = getFirst(definition.tagNameNodes) || getFirst(definition.identifierNodes);
	const fileName = node?.getSourceFile().fileName;
	const path = fileName != null && config.cwd != null ? `./${relative(config.cwd, fileName)}` : undefined;

	const attributes = arrayDefined(
		filterVisibility(config.visibility, declaration.members).map(d => componentMemberToHtmlDataAttribute(d, checker, config))
	);

	const properties = arrayDefined(
		filterVisibility(config.visibility, declaration.members).map(d => componentMemberToHtmlDataProperty(d, checker, config))
	);

	const events = arrayDefined(filterVisibility(config.visibility, declaration.events).map(e => componentEventToHtmlDataEvent(e, checker)));

	const slots = arrayDefined(declaration.slots.map(e => componentSlotToHtmlDataSlot(e, checker)));

	const cssProperties = arrayDefined(declaration.cssProperties.map(p => componentCssPropToHtmlCssProp(p, checker)));

	const cssParts = arrayDefined(declaration.cssParts.map(p => componentCssPartToHtmlCssPart(p, checker)));

	return {
		name: definition.tagName,
		path,
		description: getDescriptionFromJsDoc(declaration.jsDoc),
		attributes: attributes.length === 0 ? undefined : attributes,
		properties: properties.length === 0 ? undefined : properties,
		events: events.length === 0 ? undefined : events,
		slots: slots.length === 0 ? undefined : slots,
		cssProperties: cssProperties.length === 0 ? undefined : cssProperties,
		cssParts: cssParts.length === 0 ? undefined : cssParts,
		deprecated: declaration.deprecated === true || typeof declaration.deprecated === "string" || undefined,
		deprecatedMessage: typeof declaration.deprecated === "string" ? declaration.deprecated : undefined
	};
}

function componentCssPropToHtmlCssProp(prop: ComponentCssProperty, checker: TypeChecker): HtmlDataCssProperty | undefined {
	return {
		name: prop.name || "",
		description: getDescriptionFromJsDoc(prop.jsDoc),
		type: prop.typeHint,
		default: prop.default != null ? JSON.stringify(prop.default) : undefined
	};
}

function componentCssPartToHtmlCssPart(part: ComponentCssPart, checker: TypeChecker): HtmlDataCssPart | undefined {
	return {
		name: part.name || "",
		description: getDescriptionFromJsDoc(part.jsDoc)
	};
}

function componentSlotToHtmlDataSlot(slot: ComponentSlot, checker: TypeChecker): HtmlDataSlot | undefined {
	return {
		name: slot.name || "",
		description: getDescriptionFromJsDoc(slot.jsDoc)
	};
}

function componentEventToHtmlDataEvent(event: ComponentEvent, checker: TypeChecker): HtmlDataEvent | undefined {
	return {
		name: event.name,
		description: getDescriptionFromJsDoc(event.jsDoc),
		deprecated: event.deprecated === true || undefined,
		deprecatedMessage: typeof event.deprecated === "string" ? event.deprecated : undefined
	};
}

function componentMemberToHtmlDataAttribute(member: ComponentMember, checker: TypeChecker, config: TransformerConfig): HtmlDataAttribute | undefined {
	if (member.attrName == null) {
		return undefined;
	}

	return {
		name: member.attrName,
		description: getDescriptionFromJsDoc(member.jsDoc),
		type: getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config),
		default: member.default != null ? JSON.stringify(member.default) : undefined,
		deprecated: member.deprecated === true || undefined,
		deprecatedMessage: typeof member.deprecated === "string" ? member.deprecated : undefined
	};
}

function componentMemberToHtmlDataProperty(member: ComponentMember, checker: TypeChecker, config: TransformerConfig): HtmlDataProperty | undefined {
	if (member.propName == null) {
		return undefined;
	}

	return {
		name: member.propName,
		attribute: member.attrName,
		description: getDescriptionFromJsDoc(member.jsDoc),
		type: getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config),
		default: member.default != null ? JSON.stringify(member.default) : undefined,
		deprecated: member.deprecated === true || undefined,
		deprecatedMessage: typeof member.deprecated === "string" ? member.deprecated : undefined
	};
}

function getDescriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc?.description;
}
