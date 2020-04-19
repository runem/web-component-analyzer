import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

/**
 * Excludes nodes from "lib.dom.d.ts" if analyzeLibDom is false
 * @param node
 * @param context
 */
export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean | undefined {
	if (context.config.analyzeDefaultLib) {
		return undefined;
	}

	return isLibDom(node);
}

function isLibDom(node: Node) {
	return node.getSourceFile().fileName.endsWith("lib.dom.d.ts");
}
