import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean | undefined {
	if (context.config.analyzeLib) {
		return undefined;
	}
	console.log(`source file`, node.getSourceFile().fileName);

	const fileName = node.getSourceFile().fileName;
	return fileName.includes("lit-element.d.ts") || fileName.endsWith("updating-element.d.ts");
}
