import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { DefinitionNodeResult } from "../analyzer-flavor";
import { parseJsDocForNode } from "./parse-js-doc-for-node";

/**
 * Discovers definitions using "@customElement" or "@element" jsdoc
 * @param node
 * @param context
 */
export function discoverDefinitions(node: Node, context: AnalyzerVisitContext): DefinitionNodeResult[] | undefined {
	// /** @customElement my-element */ myClass extends HTMLElement { ... }
	if (context.ts.isInterfaceDeclaration(node) || context.ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			["customelement", "element"],
			(tagNode, { name }) => {
				return {
					tagName: name || "",
					identifierNode: tagNode,
					declarationNode: node,
					definitionNode: tagNode
				};
			},
			context
		);
	}
}
