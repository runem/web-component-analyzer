import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

/**
 * Uses flavors to determine if a node should be excluded from the output
 * @param node
 * @param context
 */
export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean {
	for (const flavor of context.flavors) {
		const exclude = flavor.excludeNode?.(node, context);
		if (exclude) {
			return true;
		}
	}

	return false;
}
