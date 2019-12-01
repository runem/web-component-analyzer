import { Node } from "typescript";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../types/inheritance-tree";
import { visitInheritance } from "./flavor/visit-inheritance";

export function discoverInheritance(startNode: Node | Node[], context: AnalyzerVisitContext): InheritanceTreeNode {
	const nodes = Array.isArray(startNode) ? startNode : [startNode];
	const mainNode = nodes[0];

	let inherits: InheritanceTreeClause[] = [];
	for (const node of nodes) {
		visitInheritance(node, context, link => {
			inherits = inherits.concat(link);
		});
	}

	return {
		node: mainNode,
		identifier: context.ts.isInterfaceDeclaration(mainNode) || context.ts.isClassLike(mainNode) ? mainNode.name : undefined,
		inherits
	};
}
