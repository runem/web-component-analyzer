import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean | undefined {
	if (context.config.analyzeLibDom) {
		return undefined;
	}

	return isLibDom(node);
}

function isLibDom(node: Node) {
	return node.getSourceFile().fileName.endsWith("lib.dom.d.ts");
}
