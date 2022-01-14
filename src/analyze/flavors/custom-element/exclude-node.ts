import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getNodeName } from "../../util/ast-util";

/**
 * Excludes nodes from "lib.dom.d.ts" if analyzeLibDom is false
 * @param node
 * @param context
 */
export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean | undefined {
	if (context.config.analyzeDefaultLib) {
		return undefined;
	}

	// Exclude polymer element related super classes
	const declName = getNodeName(node, context);
	if (declName === "PolymerElement") {
		return true;
	}

	return isLibDom(node);
}

function isLibDom(node: Node) {
	return node.getSourceFile().fileName.endsWith("lib.dom.d.ts");
}
