import { SimpleType, toTypeString } from "ts-simple-type";
import { Program, Type, TypeChecker, Node } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { ComponentDefinition } from "../../../analyze/types/component-definition";
import { ComponentMember } from "../../../analyze/types/component-member";
import { ComponentSlot } from "../../../analyze/types/component-slot";
import { EventDeclaration } from "../../../analyze/types/event-types";
import { JsDoc } from "../../../analyze/types/js-doc";
import { flatten } from "../../util";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { HtmlData, HtmlDataAttribute, HtmlDataEvent, HtmlDataProperty, HtmlDataSlot, HtmlDataTag } from "./vscode-html-data";

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

	const declaration = definition.declaration;

	return {
		name: definition.tagName,
		description: getDescriptionFromJsDoc(declaration.jsDoc),
		example: getExamplesFromJsDoc(declaration.jsDoc),
		//jsDoc: getJsDocTextFromJsDoc(definition.declaration.jsDoc),
		path: getPathFromNode(definition.node),
		deprecated: declaration.deprecated,
		attributes,
		properties,
		events,
		slots
	};
}

function componentSlotToHtmlDataSlot(slot: ComponentSlot, checker: TypeChecker): HtmlDataSlot | undefined {
	return {
		name: slot.name || "",
		description: getDescriptionFromJsDoc(slot.jsDoc),
		example: getExamplesFromJsDoc(slot.jsDoc)
		//deprecated: slot.deprecated,
		//jsDoc: getJsDocTextFromJsDoc(slot.jsDoc)
	};
}

function componentEventToHtmlDataEvent(event: EventDeclaration, checker: TypeChecker): HtmlDataEvent | undefined {
	return {
		name: event.name,
		description: getDescriptionFromJsDoc(event.jsDoc),
		example: getExamplesFromJsDoc(event.jsDoc)
		//deprecated: event.deprecated,
		//jsDoc: getJsDocTextFromJsDoc(event.jsDoc)
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
				example: getExamplesFromJsDoc(member.jsDoc),
				//jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
				deprecated: member.deprecated,
				type: getJsDocTypeFromType(member.type, checker)
			};
	}

	return undefined;
}

function componentMemberToHtmlDataProperty(member: ComponentMember, checker: TypeChecker): HtmlDataProperty | undefined {
	switch (member.kind) {
		case "property":
			return {
				name: member.propName,
				description: getDescriptionFromJsDoc(member.jsDoc),
				//jsDoc: getJsDocTextFromJsDoc(member.jsDoc),
				example: getExamplesFromJsDoc(member.jsDoc),
				type: getJsDocTypeFromType(member.type, checker),
				attribute: member.attrName,
				default: member.default,
				deprecated: member.deprecated,
				reflect: member.attrName == null ? undefined : "both" // fixed for now
			};
	}

	return undefined;
}

function getDescriptionFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc != null ? jsDoc.comment : undefined;
}

/*function getJsDocTextFromJsDoc(jsDoc: JsDoc | undefined): string | undefined {
	return jsDoc != null && jsDoc.node != null ? jsDoc.node.getText() : undefined;
}*/

function getPathFromNode(node: Node): string {
	return node.getSourceFile().fileName.replace(process.cwd(), "");
}

function getExamplesFromJsDoc(jsDoc: JsDoc | undefined): string[] | undefined {
	if (jsDoc == null || jsDoc.node == null || jsDoc.node.tags == null) {
		return undefined;
	}

	const exampleTags = jsDoc.node.tags.filter(tag => tag.tagName.getText() === "example" && tag.comment != null);
	if (exampleTags.length === 0) {
		return undefined;
	}

	return exampleTags.map(tag => tag.comment || "");
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
