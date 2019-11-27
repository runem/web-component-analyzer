import { Node } from "typescript";
import { InheritanceTreeClause, InheritanceTreeNode } from "../types/inheritance-tree";
import { AnalyzerVisitContext } from "../analyzer-visit-context";
import { visitInheritance } from "./flavor/visit-inheritance";

export function discoverInheritance(startNode: Node, context: AnalyzerVisitContext): InheritanceTreeNode {
	let inherits: InheritanceTreeClause[] = [];
	visitInheritance(startNode, context, link => {
		inherits = inherits.concat(link);
	});

	return {
		node: startNode,
		identifier: context.ts.isInterfaceDeclaration(startNode) || context.ts.isClassLike(startNode) ? startNode.name : undefined,
		inherits
	};
}
