import { Node } from "typescript";
import { getJsDoc } from "../../util/js-doc-util";
import { VisitComponentDefinitionContext } from "../parse-component-flavor";

/**
 * Parses @customElement js doc annotations on interface/class-like nodes and emits a definition.
 * @param node
 * @param context
 */
export function visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext) {
	const { ts } = context;

	// /** @customElement my-element */ myClass extends HTMLElement { ... }
	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		const jsDoc = getJsDoc(node, ts);

		if (jsDoc != null && jsDoc.tags != null) {
			for (const tag of jsDoc.tags) {
				if (["customelement", "element"].includes(tag.tag.toLowerCase()) && tag.comment) {
					context.emitDefinitionResult({
						tagName: tag.comment,
						identifierNode: tag.node,
						declarationNode: node,
						definitionNode: tag.node
					});
				}
			}
		}
	}

	node.forEachChild(child => visitComponentDefinitions(child, context));
}
