import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getNodeName } from "../../util/ast-util";

export function excludeNode(node: Node, context: AnalyzerVisitContext): boolean | undefined {
	if (context.config.analyzeDependencies) {
		return undefined;
	}

	// Exclude lit element related super classes if "analyzeLib" is false
	const declName = getNodeName(node, context);
	if (declName != null) {
		return declName === "LitElement" || declName === "UpdatingElement";
	} else {
		const fileName = node.getSourceFile().fileName;

		return fileName.includes("/lit-element.") || fileName.endsWith("/updating-element.");
	}
}
