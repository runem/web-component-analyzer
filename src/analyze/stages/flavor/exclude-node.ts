import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean {
	for (const flavor of context.flavors) {
		const exclude = flavor.excludeNode?.(node, context);
		if (exclude) {
			return true;
		}
	}

	return false;
}
