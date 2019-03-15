import { Node } from "typescript";
import { getInterfaceKeys } from "../../util/ast-util";
import { DefinitionNodeResult, VisitComponentDefinitionContext } from "../parse-component-flavor";
import { parseDeclarationMembers } from "./parse-declaration-members";

/**
 * Visits stencil like component definitions.
 * Right now it only parses "StencilIntrinsicElements" and emits attributes for this interface
 * because "custom element" flavor parses the property related version of the element.
 * @param node
 * @param context
 */
export function visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): DefinitionNodeResult[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node)) {
		// interface HTMLElementTagNameMap { "my-button": MyButton; }
		if (["StencilIntrinsicElements"].includes(node.name.text)) {
			const extensions = getInterfaceKeys(node, context);
			for (const [tagName, declaration] of extensions) {
				// Emit a definition result and set an explicit declaration handler
				context.emitDefinitionResult({
					tagName,
					definitionNode: node,
					declarationNode: declaration,
					declarationHandler: parseDeclarationMembers
				});
			}
		}
		return;
	}

	node.forEachChild(child => {
		visitComponentDefinitions(child, context);
	});
}
