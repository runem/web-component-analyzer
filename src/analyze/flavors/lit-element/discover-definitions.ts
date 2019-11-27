import { Node } from "typescript";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { DefinitionNodeResult } from "../analyzer-flavor";

/**
 * Visits lit-element related definitions.
 * Specifically it finds the usage of the @customElement decorator.
 * @param node
 * @param context
 */
export function discoverDefinitions(node: Node, context: AnalyzerVisitContext): DefinitionNodeResult[] | undefined {
	const { ts, checker } = context;

	// @customElement("my-element")
	if (ts.isClassDeclaration(node)) {
		for (const decorator of node.decorators || []) {
			const callExpression = decorator.expression;
			if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
				const decoratorIdentifierName = callExpression.expression.escapedText;
				if (decoratorIdentifierName === "customElement") {
					// Resolve the value of the first argument. This is the tag name.
					const unresolvedTagNameNode = callExpression.arguments[0];
					const resolvedTagNameNode = resolveNodeValue(unresolvedTagNameNode, { ts, checker });

					if (resolvedTagNameNode != null && typeof resolvedTagNameNode.value === "string") {
						return [
							{
								tagName: resolvedTagNameNode.value,
								tagNameNode: resolvedTagNameNode.node,
								declarationNode: node
							}
						];
					}
				}
			}
		}

		return;
	}

	node.forEachChild(child => {
		discoverDefinitions(child, context);
	});
}
