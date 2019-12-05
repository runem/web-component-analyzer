import { Node } from "typescript";
import { ComponentMethod } from "../../types/features/component-method";
import { getMemberVisibilityFromNode, isMemberAndWritable } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { AnalyzerDeclarationVisitContext } from "../analyzer-flavor";

export function discoverMethods(node: Node, context: AnalyzerDeclarationVisitContext): ComponentMethod[] | undefined {
	const { ts } = context;

	// Never pick up method declaration not declared directly on the declaration node being traversed
	if (node.parent !== context.declarationNode) {
		return undefined;
	}

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
				visibility: getMemberVisibilityFromNode(node, ts),
				type: lazy(() => context.checker.getTypeAtLocation(node))
			}
		];
	}

	return undefined;
}

function isHTMLElementMethodName(name: string): boolean {
	return ["attributeChangedCallback", "connectedCallback", "disconnectedCallback"].includes(name);
}
