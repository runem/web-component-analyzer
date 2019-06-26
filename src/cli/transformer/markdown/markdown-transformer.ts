import { isAssignableToSimpleTypeKind, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { Program, TypeChecker } from "typescript";
import { AnalyzeComponentsResult } from "../../../analyze/analyze-components";
import { ComponentCSSProperty } from "../../../analyze/types/component-css-property";
import { ComponentMemberAttribute, ComponentMemberProperty } from "../../../analyze/types/component-member";
import { ComponentSlot } from "../../../analyze/types/component-slot";
import { EventDeclaration } from "../../../analyze/types/event-types";
import { flatten } from "../../util";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { markdownHeader, markdownHighlight, markdownTable } from "../util/markdown-util";

/**
 * Transforms the component results to markdown
 * @param results
 * @param program
 * @param config
 */
export function markdownTransformer(results: AnalyzeComponentsResult[], program: Program, config: WcaCliConfig): string {
	// Grab all definitions
	const definitions = flatten(results.map(res => res.componentDefinitions));

	// Transform all definitions to markdown
	const markdownSegments = definitions.map(definition => {
		const { declaration } = definition;

		// Add tagName as header
		let segmentText = markdownHeader(definition.tagName, 1, config);

		// Add component jsdoc comment to the output
		if (declaration.jsDoc != null && declaration.jsDoc.comment != null) segmentText += `\n\n${declaration.jsDoc.comment}\n`;

		// Grab all items from the component and add them as tables to the output.
		const properties = declaration.members
			.filter((m): m is ComponentMemberProperty => m.kind === "property")
			.sort((a, b) => (a.propName < b.propName ? -1 : 1));
		const attributes = declaration.members
			.filter((m): m is ComponentMemberAttribute => m.kind === "attribute")
			.sort((a, b) => (a.attrName < b.attrName ? -1 : 1));
		const slots = declaration.slots.sort((a, b) => (a.name == null ? -1 : b.name == null ? 1 : a.name < b.name ? -1 : 1));
		const events = declaration.events.sort((a, b) => (a.name < b.name ? -1 : 1));
		const cssProps = declaration.cssProperties.sort((a, b) => (a.name < b.name ? -1 : 1));

		if (attributes.length > 0) {
			segmentText += "\n" + memberAttributeSection(attributes, program.getTypeChecker(), config);
		}

		if (properties.length > 0) {
			segmentText += "\n" + memberPropertySection(properties, program.getTypeChecker(), config);
		}

		if (events.length > 0) {
			segmentText += "\n" + eventSection(events, config, program.getTypeChecker());
		}

		if (cssProps.length > 0) {
			segmentText += "\n" + cssPropSection(cssProps, config);
		}

		if (slots.length > 0) {
			segmentText += "\n" + slotSection(slots, config);
		}

		return segmentText;
	});

	return markdownSegments.join("\n\n");
}

/**
 * Returns a markdown table with css props
 * @param cssProperty
 * @param config
 */
function cssPropSection(cssProperty: ComponentCSSProperty[], config: WcaCliConfig): string {
	const rows: string[][] = [["Property", "Description"]];
	rows.push(...cssProperty.map(prop => [(prop.name && markdownHighlight(prop.name)) || "", (prop.jsDoc && prop.jsDoc.comment) || ""]));
	return markdownHeader("CSS Custom Properties", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with events
 * @param events
 * @param config
 * @param checker
 */
function eventSection(events: EventDeclaration[], config: WcaCliConfig, checker: TypeChecker): string {
	const rows: string[][] = [["Event", "Detail", "Description"]];
	rows.push(
		...events.map(event => [
			(event.name && markdownHighlight(event.name)) || "",
			isAssignableToSimpleTypeKind(event.type, SimpleTypeKind.ANY, checker) ? "" : markdownHighlight(toTypeString(event.type, checker)),
			(event.jsDoc && event.jsDoc.comment) || ""
		])
	);
	return markdownHeader("Events", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with slots
 * @param slots
 * @param config
 */
function slotSection(slots: ComponentSlot[], config: WcaCliConfig): string {
	const rows: string[][] = [["Name", "Permitted Tag Names", "Description"]];
	rows.push(
		...slots.map(slot => [
			(slot.name && markdownHighlight(slot.name)) || "",
			(slot.permittedTagNames && slot.permittedTagNames.map(tagName => markdownHighlight(tagName)).join(" | ")) || "",
			(slot.jsDoc && slot.jsDoc.comment) || ""
		])
	);
	return markdownHeader("Slots", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with attributes.
 * @param members
 * @param checker
 * @param config
 */
function memberAttributeSection(members: ComponentMemberAttribute[], checker: TypeChecker, config: WcaCliConfig): string {
	const rows: string[][] = [["Attribute", "Type", "Default", "Description"]];

	// Add members as rows one by one
	for (const member of members) {
		const attrName = markdownHighlight(member.attrName);
		const type = markdownHighlight(toTypeString(member.type, checker));
		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = (member.jsDoc && member.jsDoc.comment) || "";

		rows.push([attrName, type, def, comment]);
	}

	return markdownHeader("Attributes", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with properties
 * @param members
 * @param checker
 * @param config
 */
function memberPropertySection(members: ComponentMemberProperty[], checker: TypeChecker, config: WcaCliConfig): string {
	const rows: string[][] = [["Property", "Attribute", "Type", "Default", "Description"]];

	// Add properties as rows one by one
	for (const member of members) {
		const propName = markdownHighlight(member.propName);
		const attrName = (member.attrName && markdownHighlight(member.attrName)) || "";
		const type = markdownHighlight(toTypeString(member.type, checker));
		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = (member.jsDoc && member.jsDoc.comment) || "";

		rows.push([propName, attrName, type, def, comment]);
	}

	return markdownHeader("Properties", 2, config) + "\n" + markdownTable(rows);
}
