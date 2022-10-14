import { Decorator, Node, NodeArray } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getNodeIdentifier } from "../../util/ast-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
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
		// As of TypeScript 4.8 decorators have been moved from the `decorators`
		// property into `modifiers`. For compatibility with both, we manually check
		// use both here rather than using the new `getDecorators` function.
		//
		// https://devblogs.microsoft.com/typescript/announcing-typescript-4-8/#decorators-are-placed-on-modifiers-on-typescripts-syntax-trees
		const decorators = Array.from((node.decorators ?? []) as NodeArray<Decorator>);
		for (const modifier of node.modifiers ?? []) {
			if (ts.isDecorator(modifier)) {
				decorators.push(modifier);
			}
		}

		// Visit all decorators on the class
		for (const decorator of decorators) {
			const callExpression = decorator.expression;

			// Find "@customElement"
			if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
				const decoratorIdentifierName = callExpression.expression.escapedText;

				// Decorators called "customElement"
				if (decoratorIdentifierName === "customElement") {
					// Resolve the value of the first argument. This is the tag name.
					const unresolvedTagNameNode = callExpression.arguments[0];
					const resolvedTagNameNode = resolveNodeValue(unresolvedTagNameNode, { ts, checker, strict: true });
					const identifier = getNodeIdentifier(node, context);

					if (resolvedTagNameNode != null && typeof resolvedTagNameNode.value === "string") {
						return [
							{
								tagName: resolvedTagNameNode.value,
								tagNameNode: resolvedTagNameNode.node,
								identifierNode: identifier
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
