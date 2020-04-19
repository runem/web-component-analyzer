import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getInterfaceKeys } from "../../util/ast-util";
import { DefinitionNodeResult } from "../analyzer-flavor";

/**
 * Discovers element definitions in "IntrinsicElements"
 * @param node
 * @param context
 */
export function discoverDefinitions(node: Node, context: AnalyzerVisitContext): DefinitionNodeResult[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node)) {
		if (node.name.text === "IntrinsicElements") {
			const extensions = getInterfaceKeys(node, context);
			return extensions.map(({ key, keyNode, identifier, declaration }) => ({
				tagName: key,
				tagNameNode: keyNode,
				identifierNode: identifier,
				declarationNode: declaration
			}));
		}
	}

	return undefined;
}
