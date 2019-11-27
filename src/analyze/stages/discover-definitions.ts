import { Node, SourceFile } from "typescript";
import { ComponentDeclaration } from "../types/features/component-declaration";
import { ComponentDefinition } from "../types/features/component-definition";
import { lazy } from "../util/lazy";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { visitDefinitions } from "./flavor/visit-definitions";

/**
 * Visits the source file and finds all component definitions as "customElements.define".
 * Next it dedupes definitions and parses the corresponding component declaration for each definition.
 * @param sourceFile
 * @param context
 * @param analyzeDeclaration
 */
export function discoverDefinitions(
	sourceFile: SourceFile,
	context: AnalyzerVisitContext,
	analyzeDeclaration: (declarationNodes: Node[]) => ComponentDeclaration
): ComponentDefinition[] {
	// Find all definitions in the file
	const definitionResults = analyzeAndDedupeDefinitions(sourceFile, context);

	return Array.from(definitionResults.entries()).map(([definition, declarationSet]) => {
		return {
			...definition,
			declaration: lazy(() => analyzeDeclaration(Array.from(declarationSet)))
		};
	});
	// Go through each component declaration parsing and merging declarations.
	// We can have many definition results for the same tag name but with different declaration nodes.
	/*const declarationMap = new Map<string, ComponentDeclaration>();
	for (const definitionResult of definitionResults) {
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
	});*/
}

/**
 * Finds all component definitions in a file.
 * @param node
 * @param context
 */
function analyzeAndDedupeDefinitions(node: Node, context: AnalyzerVisitContext): Map<ComponentDefinition, Set<Node>> {
	if (node == null) return new Map();

	const tagNameDefinitionMap: Map<string, ComponentDefinition> = new Map();
	const definitionToDeclarationMap: Map<ComponentDefinition, Set<Node>> = new Map();

	visitDefinitions(node, context, results => {
		// Definitions are unique by tag name and are merged when pointing to multiple declaration nodes.
		// This is because multiple definitions can exist side by side for the same tag name (think global TagName type definition and customElements.define)
		for (const result of results) {
			let definition = tagNameDefinitionMap.get(result.tagName);

			if (definition == null) {
				definition = {
					declaration: () => {
						throw new Error("This is a noop function. It's expected that this function is overwritten.");
					},
					fromLib: false, // TODO
					tagName: result.tagName,
					tagNameNodes: new Set(),
					identifierNodes: new Set()
				};

				tagNameDefinitionMap.set(result.tagName, definition);
			}
			if (result.identifierNode != null) {
				definition.identifierNodes.add(result.identifierNode);
			}

			if (result.tagNameNode) {
				definition.tagNameNodes.add(result.tagNameNode);
			}

			let declarationNodeSet = definitionToDeclarationMap.get(definition);
			if (declarationNodeSet == null) {
				declarationNodeSet = new Set();
				definitionToDeclarationMap.set(definition, declarationNodeSet);
			}
			declarationNodeSet.add(result.declarationNode);
		}
	});

	return definitionToDeclarationMap;

	/*const definitionContext: ComponentAnalyzerVisitContext = {
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

	*/
}
