import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { InheritanceResult } from "../flavors/analyzer-flavor";
import { ComponentDeclarationKind, ComponentHeritageClause } from "../types/component-declaration";
import { visitInheritance } from "./flavor/visit-inheritance";

/**
 * Uses flavors in order to discover inheritance from one of more nodes.
 * @param startNode
 * @param visitedNodes
 * @param context
 */
export function discoverInheritance(startNode: Node | Node[], visitedNodes: Set<Node>, context: AnalyzerVisitContext): Required<InheritanceResult> {
	const nodes = Array.isArray(startNode) ? startNode : [startNode];

	let declarationKind: ComponentDeclarationKind | undefined = undefined;
	const heritageClauses: ComponentHeritageClause[] = [];
	const declarationNodes = new Set<Node>();

	for (const node of nodes) {
		visitedNodes.add(node);

		// Visit inheritance using flavors
		visitInheritance(node, context, result => {
			// Combine results into one single result
			declarationKind = declarationKind || result.declarationKind;

			if (result.declarationNodes != null) {
				for (const node of result.declarationNodes) {
					declarationNodes.add(node);
				}
			}

			if (result.heritageClauses != null) {
				heritageClauses.push(...result.heritageClauses);
			}
		});
	}

	return {
		declarationNodes: Array.from(declarationNodes),
		heritageClauses,
		declarationKind: declarationKind || "class"
	};
}
