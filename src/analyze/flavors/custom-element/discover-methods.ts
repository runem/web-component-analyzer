import { Node } from "typescript";
import { ComponentMethod } from "../../types/features/component-method";
import { getMemberVisibilityFromNode, isMemberAndWritable } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

export function discoverMethods(node: Node, context: AnalyzerVisitContext): ComponentMethod[] | undefined {
	const { ts } = context;

	// class { myMethod () {} }
	if ((ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) && isMemberAndWritable(node, ts)) {
		// Allow the analyzer to analyze within methods
		context.emitContinue?.();

		return [
			{
				jsDoc: getJsDoc(node, ts),
				name: node.name.getText(),
				node: node,
				visibility: getMemberVisibilityFromNode(node, ts)
			}
		];
	}

	return undefined;
}
