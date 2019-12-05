import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getInterfaceKeys, resolveDeclarations } from "../../util/ast-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { DefinitionNodeResult } from "../analyzer-flavor";

/**
 * Visits custom element definitions.
 * @param node
 * @param ts
 * @param checker
 */
export function discoverDefinitions(node: Node, { ts, checker }: AnalyzerVisitContext): DefinitionNodeResult[] | undefined {
	// customElements.define("my-element", MyElement)
	if (ts.isCallExpression(node)) {
		if (ts.isPropertyAccessExpression(node.expression)) {
			let leftExpression = node.expression.expression;

			if (
				ts.isPropertyAccessExpression(leftExpression) &&
				ts.isIdentifier(leftExpression.expression) &&
				leftExpression.expression.escapedText === "window"
			) {
				leftExpression = leftExpression.name;
			}

			if (
				ts.isIdentifier(leftExpression) &&
				leftExpression.escapedText === "customElements" &&
				node.expression.name != null &&
				ts.isIdentifier(node.expression.name)
			) {
				// define("my-element", MyElement)
				if (node.expression.name.escapedText === "define") {
					const [unresolvedTagNameNode, identifierNode] = node.arguments;

					// ("my-element", MyElement)
					const resolvedTagNameNode = resolveNodeValue(unresolvedTagNameNode, { ts, checker, strict: true });

					if (resolvedTagNameNode != null && identifierNode != null && typeof resolvedTagNameNode.value === "string") {
						const tagName = resolvedTagNameNode.value;
						const tagNameNode = resolvedTagNameNode.node;

						// (___, MyElement)
						if (ts.isIdentifier(identifierNode)) {
							const declarationNodes = resolveDeclarations(identifierNode, { checker, ts });

							return declarationNodes.map(declarationNode => ({
								tagName,
								identifierNode,
								tagNameNode,
								declarationNode
							}));
						}

						// (___, class { ... })
						else if (ts.isClassLike(identifierNode) || ts.isInterfaceDeclaration(identifierNode)) {
							return [
								{
									tagName,
									tagNameNode,
									declarationNode: identifierNode
								}
							];
						}
					}
				}
			}
		}

		return undefined;
	}

	// interface HTMLElementTagNameMap { "my-button": MyButton; }
	if (ts.isInterfaceDeclaration(node) && ["HTMLElementTagNameMap", "ElementTagNameMap"].includes(node.name.text)) {
		const extensions = getInterfaceKeys(node, { ts, checker });
		return extensions.map(({ key, keyNode, identifier, declaration }) => ({
			tagName: key,
			tagNameNode: keyNode,
			identifierNode: identifier,
			declarationNode: declaration
		}));
	}

	return undefined;
}
