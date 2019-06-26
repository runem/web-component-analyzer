import { Node, SourceFile } from "typescript";
import { DefinitionNodeResult, FlavorVisitContext, ParseComponentFlavor, VisitComponentDefinitionContext } from "../flavors/parse-component-flavor";
import { ComponentDeclaration } from "../types/component-declaration";
import { ComponentDefinition } from "../types/component-definition";
import { isNodeInLibDom } from "../util/ast-util";
import { isValidCustomElementName } from "../util/is-valid-custom-element-name";
import { expandDeclarationFromJsDoc } from "./expand-from-js-doc";
import { mergeDeclarations } from "./merge-declarations";
import { parseComponentDeclaration } from "./parse-declaration";

/**
 * Visits the source file and finds all component definitions as "customElements.define".
 * Next it dedupes definitions and parses the corresponding component declaration for each definition.
 * @param sourceFile
 * @param flavors
 * @param context
 */
export function parseComponentDefinitions(
	sourceFile: SourceFile,
	flavors: ParseComponentFlavor[],
	context: FlavorVisitContext
): ComponentDefinition[] {
	// Find all definitions in the file
	const definitionResults = parseComponentDefinitionResults(sourceFile, flavors, context);

	// Emit diagnostics for invalid custom element tag names.
	if (context.config.diagnostics && !isNodeInLibDom(sourceFile)) {
		for (const result of definitionResults) {
			if (!isValidCustomElementName(result.tagName)) {
				context.emitDiagnostics({
					node: result.identifierNode,
					message: `The tag name '${result.tagName}' is not a valid custom element name. Remember that a hyphen (-) is required.`,
					severity: "warning"
				});
			}
		}
	}

	// Go through each component declaration parsing and merging declarations.
	// We can have many definition results for the same tag name but with different declaration nodes.
	const declarationMap = new Map<string, ComponentDeclaration>();
	for (const definitionResult of definitionResults) {
		// Pick flavors to test. If a "declarationHandler" has been chosen set, only pick this one, else pick all flavors.
		const relevantFlavors = (definitionResult.declarationHandler && [{ parseDeclarationMembers: definitionResult.declarationHandler }]) || flavors;

		// Parse the component declaration (inside this function is all the juicy stuff)
		const declaration = parseComponentDeclaration(definitionResult.declarationNode, relevantFlavors, context);

		// Merge the declarations if necessary
		const tagName = definitionResult.tagName;
		const existingDeclaration = declarationMap.get(tagName);
		if (existingDeclaration != null) {
			declarationMap.set(tagName, mergeDeclarations([declaration, existingDeclaration], context));
		} else {
			declarationMap.set(tagName, declaration);
		}
	}

	// Only emit one definition per tag name.
	return [...declarationMap.entries()].map(([tagName, declaration]) => {
		// Find the first definition result with this tag name in the list.
		const { definitionNode } = definitionResults.find(res => res.tagName === tagName)!;

		return {
			fromLib: isNodeInLibDom(definitionNode),
			node: definitionNode,
			tagName,
			declaration: expandDeclarationFromJsDoc(declaration)
		};
	});
}

/**
 * Finds all component definitions in a file.
 * @param node
 * @param flavors
 * @param context
 */
export function parseComponentDefinitionResults(node: Node, flavors: ParseComponentFlavor[], context: FlavorVisitContext): DefinitionNodeResult[] {
	if (node == null) return [];

	const resultMap: DefinitionNodeResult[] = [];

	const definitionContext: VisitComponentDefinitionContext = {
		...context,
		emitDefinitionResult(result: DefinitionNodeResult): void {
			// Definitions are unique by the declaration node and tag name combination.
			// This is because multiple definitions can exist side by side for the same tag name (think global TagName type definition and customElements.define)
			const existingResult = resultMap.find(r => r.declarationNode === result.declarationNode && r.tagName === result.tagName);

			if (existingResult != null) {
				// Never overwrite a definition if it has a declaration handler.
				if (existingResult.declarationHandler != null) return;

				// Merge the two definitions.
				Object.assign(existingResult, result);
			} else {
				resultMap.push(result);
			}
		}
	};

	// Run through all flavors finding component definitions.
	for (const flavor of flavors) {
		if (flavor.visitComponentDefinitions == null) continue;
		flavor.visitComponentDefinitions(node, definitionContext);
	}

	return [...resultMap];
}
