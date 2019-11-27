import { Node } from "typescript";
import { InheritanceTreeClause, InheritanceTreeNode } from "../../types/inheritance-tree";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

export function visitAndExpandInheritClause(inheritClause: InheritanceTreeClause, context: AnalyzerVisitContext): InheritanceTreeClause {
	const resolved = (() => {
		if (inheritClause.resolved == null) return undefined;

		return inheritClause.resolved.map(resolved => {
			let inheritance: InheritanceTreeClause[] = [];
			visitInheritance(resolved.node, context, results => {
				inheritance = inheritance.concat(results);
			});

			return {
				...resolved,
				inherits: inheritance
			} as InheritanceTreeNode;
		});
	})();

	return {
		...inheritClause,
		horizontalInherits: inheritClause.horizontalInherits?.map(arg => visitAndExpandInheritClause(arg, context)),
		resolved
	};
}

export function visitInheritance(node: Node, context: AnalyzerVisitContext, emit: (results: InheritanceTreeClause[]) => void): void {
	const result = executeFunctionsUntilMatch(context.flavors, "discoverInheritance", node, context);

	if (result != null) {
		emit(result.value.map(link => visitAndExpandInheritClause(link, context)));

		if (!result.shouldContinue) return;
	}

	// Visit child nodes
	/*node.forEachChild(child => {
	 visitInheritance2(child, context, emit);
	 });*/
}
