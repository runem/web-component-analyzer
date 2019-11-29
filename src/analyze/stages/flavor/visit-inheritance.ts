import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../../types/inheritance-tree";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

export function visitAndExpandInheritClause(
	inheritClause: InheritanceTreeClause,
	context: AnalyzerVisitContext,
	visitSet: Set<Node>
): InheritanceTreeClause {
	const resolved = (() => {
		if (inheritClause.resolved == null) return undefined;

		return inheritClause.resolved.map(resolved => {
			let inheritance: InheritanceTreeClause[] = [];
			visitInheritance(
				resolved.node,
				context,
				results => {
					inheritance = inheritance.concat(results);
				},
				visitSet
			);

			return {
				...resolved,
				inherits: inheritance
			} as InheritanceTreeNode;
		});
	})();

	return {
		...inheritClause,
		horizontalInherits: inheritClause.horizontalInherits?.map(arg => visitAndExpandInheritClause(arg, context, visitSet)),
		resolved
	};
}

export function visitInheritance(
	node: Node,
	context: AnalyzerVisitContext,
	emit: (results: InheritanceTreeClause[]) => void,
	visitSet?: Set<Node>
): void {
	visitSet = visitSet || new Set();

	if (visitSet.has(node)) {
		return;
	}

	visitSet.add(node);

	const result = executeFunctionsUntilMatch(context.flavors, "discoverInheritance", node, context);

	if (result != null) {
		emit(result.value.map(link => visitAndExpandInheritClause(link, context, visitSet!)));

		if (!result.shouldContinue) return;
	}
}
