import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { InheritanceTreeClause, InheritanceTreeNode } from "../../types/inheritance-tree";
import { executeFunctionsUntilMatch } from "../../util/execute-functions-until-match";

/**
 * Uses flavors to find inheritance for a node
 * @param node
 * @param context
 * @param emit
 * @param visitSet
 */
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

	// Discover inheritance tree clauses for a given node
	const result = executeFunctionsUntilMatch(context.flavors, "discoverInheritance", node, context);

	if (result != null) {
		// Emit the found inheritance tree clauses and expand them! (walk down the inheritance tree)
		emit(result.value.map(link => visitAndExpandInheritClause(link, context, visitSet!)));

		if (!result.shouldContinue) return;
	}
}

/**
 * Uses flavors to find inheritance for a node
 * This function expands an inherit clause by visiting inheritance on the resolved node.
 * @param inheritClause
 * @param context
 * @param visitSet
 */
function visitAndExpandInheritClause(
	inheritClause: InheritanceTreeClause,
	context: AnalyzerVisitContext,
	visitSet: Set<Node>
): InheritanceTreeClause {
	const resolved = (() => {
		if (inheritClause.resolved == null) return undefined;

		// Find the inheritance on the resolved node and built up an inheritance tree node
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
		// Expand the horizontal inheritance (mixins)
		horizontalInherits: inheritClause.horizontalInherits?.map(arg => visitAndExpandInheritClause(arg, context, visitSet)),
		resolved
	};
}
