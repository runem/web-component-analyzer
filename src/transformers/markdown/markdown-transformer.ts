import { Program, TypeChecker } from "typescript";
import { AnalyzerResult } from "../../analyze/types/analyzer-result";
import { ComponentCssPart } from "../../analyze/types/features/component-css-part";
import { ComponentCssProperty } from "../../analyze/types/features/component-css-property";
import { ComponentEvent } from "../../analyze/types/features/component-event";
import { ComponentMemberAttribute, ComponentMemberProperty } from "../../analyze/types/features/component-member";
import { ComponentMethod } from "../../analyze/types/features/component-method";
import { ComponentSlot } from "../../analyze/types/features/component-slot";
import { VisibilityKind } from "../../analyze/types/visibility-kind";
import { getMixinsForInheritanceTree } from "../../analyze/util/inheritance-tree-util";
import { arrayFlat } from "../../util/array-util";
import { getExamplesFromComponent } from "../../util/get-examples-from-component";
import { getTypeHintFromMethod } from "../../util/get-type-hint-from-method";
import { getTypeHintFromType } from "../../util/get-type-hint-from-type";
import { filterVisibility } from "../../util/model-util";
import { TransformerConfig } from "../transformer-config";
import { TransformerFunction } from "../transformer-function";
import { markdownHeader, markdownHighlight, markdownTable } from "./markdown-util";

/**
 * Transforms the component results to markdown
 * @param results
 * @param program
 * @param config
 */
export const markdownTransformer: TransformerFunction = (results: AnalyzerResult[], program: Program, config: TransformerConfig): string => {
	// Grab all definitions
	const definitions = arrayFlat(results.map(res => res.componentDefinitions));

	// Transform all definitions to markdown
	const markdownSegments = definitions.map(definition => {
		const declaration = definition.declaration();

		// Add tagName as header
		let segmentText = markdownHeader(definition.tagName, 1, config) + "\n";

		// Add component jsdoc comment to the output
		if (declaration.jsDoc?.description != null) segmentText += `\n${declaration.jsDoc?.description}\n`;

		// Add mixins (don't include mixins prefixed with _)
		const mixins = Array.from(getMixinsForInheritanceTree(declaration.inheritanceTree).values()).filter(mixin => !mixin.startsWith("_"));

		if (mixins.length > 0) {
			segmentText += `\n**Mixins:** ${mixins.join(", ")}\n`;
		}

		// Add examples
		const examples = getExamplesFromComponent(declaration);
		if (examples.length > 0) {
			segmentText += "\n" + markdownHeader(`Example${examples.length > 1 ? "s" : ""}`, 2, config) + "\n";

			for (const example of examples) {
				if (example.description != null) {
					segmentText += `\n${example.description}\n`;
				}
				segmentText += `\n\`\`\`${example.lang || ""}\n${example.code}\n\`\`\`\n`;
			}
		}

		// Grab all items from the component and add them as tables to the output.
		const properties = filterVisibility(
			config.visibility,
			declaration.members.filter((m): m is ComponentMemberProperty => m.kind === "property").sort((a, b) => (a.propName < b.propName ? -1 : 1))
		);
		const attributes = filterVisibility(
			config.visibility,
			declaration.members.filter((m): m is ComponentMemberAttribute => m.kind === "attribute").sort((a, b) => (a.attrName < b.attrName ? -1 : 1))
		);
		const methods = filterVisibility(
			config.visibility,
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
};

/**
 * Returns a markdown table with css props
 * @param cssProperties
 * @param config
 */
function cssPropSection(cssProperties: ComponentCssProperty[], config: TransformerConfig): string {
	const rows: string[][] = [["Property", "Type", "Default", "Description"]];
	rows.push(
		...cssProperties.map(prop => {
			const def = (prop.default !== undefined ? JSON.stringify(prop.default) : "") || "";

			return [(prop.name && markdownHighlight(prop.name)) || "", prop.typeHint || "", def, prop.jsDoc?.description || ""];
		})
	);
	return markdownHeader("CSS Custom Properties", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with css parts
 * @param cssPart
 * @param config
 */
function cssPartSection(cssPart: ComponentCssPart[], config: TransformerConfig): string {
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
function methodSection(methods: ComponentMethod[], checker: TypeChecker, config: TransformerConfig): string {
	const showVisibility = shouldShowVisibility(methods, config);
	const rows: string[][] = [["Method", "Visibility", "Type", "Description"]];
	rows.push(
		...methods.map(method => {
			// Build up a description of parameters
			const paramDescription =
				method.jsDoc?.tags
					?.filter(tag => tag.tag === "param" && tag.comment != null)
					.map(tag => {
						return `**${tag.parsed().name}**: ${tag.parsed().description}`;
					})
					.join("\n")
					.trim() || undefined;

			const description = method.jsDoc?.description || undefined;

			return [
				method.name != null ? markdownHighlight(method.name) : "",
				showVisibility ? method.visibility || "public" : "",
				markdownHighlight(getTypeHintFromMethod(method, checker)),
				`${description || ""}${description != null && paramDescription != null ? "\n\n" : ""}${paramDescription || ""}`
			];
		})
	);
	return markdownHeader("Methods", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with events
 * @param events
 * @param config
 * @param checker
 */
function eventSection(events: ComponentEvent[], checker: TypeChecker, config: TransformerConfig): string {
	const showVisibility = shouldShowVisibility(events, config);
	const rows: string[][] = [["Event", "Visibility", "Detail", "Description"]];
	rows.push(
		...events.map(event => [
			(event.name && markdownHighlight(event.name)) || "",
			showVisibility ? event.visibility || "public" : "",
			markdownHighlight(getTypeHintFromType(event.typeHint ?? event.type?.(), checker, config)),
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
function slotSection(slots: ComponentSlot[], config: TransformerConfig): string {
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
function memberAttributeSection(members: ComponentMemberAttribute[], checker: TypeChecker, config: TransformerConfig): string {
	const showVisibility = shouldShowVisibility(members, config);
	const rows: string[][] = [["Attribute", "Visibility", "Type", "Default", "Description"]];

	// Add members as rows one by one
	for (const member of members) {
		const attrName = markdownHighlight(member.attrName);
		const type = markdownHighlight(getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config));
		const visibility = member.visibility || "public";
		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = member.jsDoc?.description || "";

		rows.push([attrName, showVisibility ? visibility : "", type, def, comment]);
	}

	return markdownHeader("Attributes", 2, config) + "\n" + markdownTable(rows);
}

/**
 * Returns a markdown table with properties
 * @param members
 * @param checker
 * @param config
 */
function memberPropertySection(members: ComponentMemberProperty[], checker: TypeChecker, config: TransformerConfig): string {
	const showVisibility = shouldShowVisibility(members, config);
	const rows: string[][] = [["Property", "Attribute", "Visibility", "Modifiers", "Type", "Default", "Description"]];

	// Add properties as rows one by one
	for (const member of members) {
		const propName = markdownHighlight(member.propName);
		const attrName = (member.attrName && markdownHighlight(member.attrName)) || "";
		const visibility = member.visibility || "public";
		const type = markdownHighlight(getTypeHintFromType(member.typeHint ?? member.type?.(), checker, config));
		const mods = member.modifiers != null ? Array.from(member.modifiers).join(", ") : "";

		const def = (member.default !== undefined ? JSON.stringify(member.default) : "") || (member.required && "**required**") || "";
		const comment = member.jsDoc?.description || "";

		rows.push([propName, attrName, showVisibility ? visibility : "", mods, type, def, comment]);
	}

	return markdownHeader("Properties", 2, config) + "\n" + markdownTable(rows);
}

function shouldShowVisibility<T extends { visibility?: VisibilityKind }>(items: T[], config: TransformerConfig): boolean {
	return (
		config.visibility != null && config.visibility !== "public" && items.some(method => method.visibility != null && method.visibility !== "public")
	);
}
