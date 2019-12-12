import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../types/inheritance-tree";
import { getDeclarationIdentifier } from "../util/ast-util";
import { visitInheritance } from "./flavor/visit-inheritance";

/**
 * Uses flavors in order to discover inheritance from one of more nodes.
 * @param startNode
 * @param context
 */
export function discoverInheritance(startNode: Node | Node[], context: AnalyzerVisitContext): InheritanceTreeNode {
	const nodes = Array.isArray(startNode) ? startNode : [startNode];
	const mainNode = nodes[0];

	let inherits: InheritanceTreeClause[] = [];
	for (const node of nodes) {
		// Visit inheritance using flavors
		visitInheritance(node, context, link => {
			inherits = inherits.concat(link);
		});
	}

	return {
		node: mainNode,
		identifier: getDeclarationIdentifier(mainNode, context),
		inherits
	};
}
