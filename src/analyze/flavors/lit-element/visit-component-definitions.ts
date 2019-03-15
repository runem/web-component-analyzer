import { Node } from "typescript";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { VisitComponentDefinitionContext } from "../parse-component-flavor";

/**
 * Visits lit-element related definitions.
 * Specifically it finds the usage of the @customElement decorator.
 * @param node
 * @param context
 */
export function visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext) {
	const { ts, checker } = context;

	// @customElement("my-element")
	if (ts.isClassDeclaration(node)) {
		for (const decorator of node.decorators || []) {
			const callExpression = decorator.expression;
			if (ts.isCallExpression(callExpression) && ts.isIdentifier(callExpression.expression)) {
				const decoratorIdentifierName = callExpression.expression.escapedText;
				if (decoratorIdentifierName === "customElement") {
					// Resolve the value of the first argument. This is the tag name.
					const tagName = resolveNodeValue(callExpression.arguments[0], { ts, checker });

					if (typeof tagName === "string") {
						context.emitDefinitionResult({
							tagName: tagName,
							definitionNode: node,
							declarationNode: node
						});
					}
				}
			}
		}

		return;
	}

	node.forEachChild(child => {
		visitComponentDefinitions(child, context);
	});
}
