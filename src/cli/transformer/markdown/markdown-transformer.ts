import { isAssignableToSimpleTypeKind, SimpleType, SimpleTypeKind, toTypeString } from "ts-simple-type";
import { Program, Type, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../../analyze/types/analyzer-result";
import { ComponentCssPart } from "../../../analyze/types/features/component-css-part";
import { ComponentCssProperty } from "../../../analyze/types/features/component-css-property";
import { ComponentEvent } from "../../../analyze/types/features/component-event";
import { ComponentMemberAttribute, ComponentMemberProperty } from "../../../analyze/types/features/component-member";
import { ComponentMethod } from "../../../analyze/types/features/component-method";
import { ComponentSlot } from "../../../analyze/types/features/component-slot";
import { filterVisibility, flatten } from "../../util";
import { WcaCliConfig } from "../../wca-cli-arguments";
import { markdownHeader, markdownHighlight, markdownTable } from "../util/markdown-util";

/**
 * Transforms the component results to markdown
 * @param results
 * @param program
 * @param config
 */
export function markdownTransformer(results: AnalyzerResult[], program: Program, config: WcaCliConfig): string {
	// Grab all definitions
	const definitions = flatten(results.map(res => res.componentDefinitions));

	// Transform all definitions to markdown
	const markdownSegments = definitions.map(definition => {
		const declaration = definition.declaration();

		// Add tagName as header
		let segmentText = markdownHeader(definition.tagName, 1, config);

		// Add component jsdoc comment to the output
		if (declaration.jsDoc?.description != null) segmentText += `\n\n${declaration.jsDoc?.description}\n`;
		console.log(config);

		// Grab all items from the component and add them as tables to the output.
		const properties = filterVisibility(
			config.visibility || "public",
			declaration.members.filter((m): m is ComponentMemberProperty => m.kind === "property").sort((a, b) => (a.propName < b.propName ? -1 : 1))
		);
		const attributes = filterVisibility(
			config.visibility || "public",
			declaration.members.filter((m): m is ComponentMemberAttribute => m.kind === "attribute").sort((a, b) => (a.attrName < b.attrName ? -1 : 1))
		);
		const methods = filterVisibility(
			config.visibility || "public",
			declaration.methods.sort((a, b) => (a.name < b.name ? -1 : 1))
		);
		const slots = declaration.slots.sort((a, b) => (a.name == null ? -1 : b.name == null ? 1 : a.name < b.name ? -1 : 1));
		const events = declaration.events.sort((a, b) => (a.name < b.name ? -1 : 1));
		const cssProps = declaration.cssProperties.sort((a, b) => (a.name < b.name ? -1 : 1));
		const cssParts = declaration.cssParts.sort((a, b) => (a.name < b.name ? -1 : 1));

		if (attributes.length > 0) {
			segmentText += "\n" + memberAttributeSection(attributes, program.getTypeChecker(), config);
		}

		if (properties.length > 0) {
			segmentText += "\n" + memberPropertySection(properties, program.getTypeChecker(), config);
		}

		if (methods.length > 0) {
			segmentText += "\n" + methodSection(methods, program.getTypeChecker(), config);
		}

		if (events.length > 0) {
			segmentText += "\n" + eventSection(events, program.getTypeChecker(), config);
		}

		if (slots.length > 0) {
			segmentText += "\n" + slotSection(slots, config);
		}

		if (cssParts.length > 0) {
			segmentText += "\n" + cssPartSection(cssParts, config);
		}

		if (cssProps.length > 0) {
			segmentText += "\n" + cssPropSection(cssProps, config);
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
function cssPropSection(cssProperty: ComponentCssProperty[], config: WcaCliConfig): string {
	const rows: string[][] = [["Property", "Description"]];
	rows.push(...cssProperty.map(prop => [(prop.name && markdownHighlight(prop.name)) || "", prop.jsDoc?.description || ""]));
	return markdownHeader("CSS Custom Properties", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with css parts
 * @param cssPart
 * @param config
 */
function cssPartSection(cssPart: ComponentCssPart[], config: WcaCliConfig): string {
	const rows: string[][] = [["Part", "Description"]];
	rows.push(...cssPart.map(part => [(part.name && markdownHighlight(part.name)) || "", part.jsDoc?.description || ""]));
	return markdownHeader("CSS Shadow Parts", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with methods
 * @param methods
 * @param checker
 * @param config
 */
function methodSection(methods: ComponentMethod[], checker: TypeChecker, config: WcaCliConfig): string {
	const rows: string[][] = [["Method", "Description"]];
	rows.push(...methods.map(method => [(method.name && markdownHighlight(method.name)) || "", method.jsDoc?.description || ""]));
	return markdownHeader("Methods", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with events
 * @param events
 * @param config
 * @param checker
 */
function eventSection(events: ComponentEvent[], checker: TypeChecker, config: WcaCliConfig): string {
	const rows: string[][] = [["Event", "Detail", "Description"]];
	rows.push(
		...events.map(event => [
			(event.name && markdownHighlight(event.name)) || "",
			isAssignableToSimpleTypeKind(event.type(), SimpleTypeKind.ANY, checker) ? "" : markdownHighlight(toTypeString(event.type(), checker)),
			event.jsDoc?.description || ""
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
			slot.jsDoc?.description || ""
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
		const type = markdownHighlight(getTypeHintFromType(member.typeHint ?? member.type?.(), checker));
		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = member.jsDoc?.description || "";

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
		const type = markdownHighlight(getTypeHintFromType(member.typeHint ?? member.type?.(), checker));
		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = member.jsDoc?.description || "";

		rows.push([propName, attrName, type, def, comment]);
	}

	return markdownHeader("Properties", 2, config) + "\n" + markdownTable(rows);
}

function getTypeHintFromType(type: string | Type | SimpleType | undefined, checker: TypeChecker): string | undefined {
	if (type == null) return undefined;
	if (typeof type === "string") return type;

	const typeHint = toTypeString(type, checker);
	if (typeHint === "any") return undefined;

	return typeHint;
}
