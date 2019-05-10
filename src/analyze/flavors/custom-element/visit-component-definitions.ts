import { Node } from "typescript";
import { getInterfaceKeys, resolveDeclarations } from "../../util/ast-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { DefinitionNodeResult, VisitComponentDefinitionContext } from "../parse-component-flavor";

/**
 * Visits custom element component definitions.
 * @param node
 * @param context
 */
export function visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): DefinitionNodeResult[] | undefined {
	const { checker, ts } = context;

	// customElements.define("my-element", MyElement)
	if (ts.isCallExpression(node)) {
		if (ts.isPropertyAccessExpression(node.expression)) {
			if (node.expression.name != null && ts.isIdentifier(node.expression.name)) {
				// define("my-element", MyElement)
				if (node.expression.name.escapedText === "define") {
					const [tagNameNode, identifierNode] = node.arguments;

					// ("my-element", MyElement)
					const tagName = resolveNodeValue(tagNameNode, { ts, checker });
					if (identifierNode != null && typeof tagName === "string") {
						const definitionNode = node;

						// (___, MyElement)
						if (ts.isIdentifier(identifierNode)) {
							const declarationNodes = resolveDeclarations(identifierNode, checker, ts);

							for (const declarationNode of declarationNodes) {
								context.emitDefinitionResult({ tagName, definitionNode, declarationNode });
							}
						}

						// (___, class { ... })
						else if (ts.isClassLike(identifierNode) || ts.isInterfaceDeclaration(identifierNode)) {
							context.emitDefinitionResult({ tagName, definitionNode, declarationNode: identifierNode });
						}
					}
				}
			}
		}

		return;
	}

	// interface HTMLElementTagNameMap { "my-button": MyButton; }
	if (ts.isInterfaceDeclaration(node) && ["HTMLElementTagNameMap", "ElementTagNameMap"].includes(node.name.text)) {
		const extensions = getInterfaceKeys(node, context);
		for (const [tagName, declaration] of extensions) {
			context.emitDefinitionResult({ tagName, definitionNode: node, declarationNode: declaration });
		}
		return;
	}

	node.forEachChild(child => {
		visitComponentDefinitions(child, context);
	});
}
