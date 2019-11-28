import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentMethod } from "../../types/features/component-method";
import { getMemberVisibilityFromNode, isMemberAndWritable } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";

export function discoverMethods(node: Node, context: AnalyzerVisitContext): ComponentMethod[] | undefined {
	const { ts } = context;

	// class { myMethod () {} }
	if ((ts.isMethodDeclaration(node) || ts.isMethodSignature(node)) && isMemberAndWritable(node, ts)) {
		const name = node.name.getText();

		if (isHTMLElementMethodName(name)) {
			return undefined;
		}

		// Allow the analyzer to analyze within methods
		context.emitContinue?.();

		return [
			{
				jsDoc: getJsDoc(node, ts),
				name,
				node: node,
				visibility: getMemberVisibilityFromNode(node, ts)
			}
		];
	}

	return undefined;
}

function isHTMLElementMethodName(name: string): boolean {
	return ["attributeChangedCallback", "connectedCallback", "disconnectedCallback"].includes(name);
}
