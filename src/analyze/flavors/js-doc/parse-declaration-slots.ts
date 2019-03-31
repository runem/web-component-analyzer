import { Node } from "typescript";
import { ComponentSlot } from "../../types/component-slot";
import { ParseComponentMembersContext } from "../parse-component-flavor";
import { parseJsDocForNode } from "./helper";

/**
 * Parses @slot js doc annotations on interface/class-like nodes.
 * @param node
 * @param context
 */
export function parseDeclarationSlots(node: Node, context: ParseComponentMembersContext): ComponentSlot[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			"slot",
			(tagNode, parsed) => {
				return {
					name: parsed.name,
					jsDoc: parsed.comment != null ? { comment: parsed.comment } : undefined
				} as ComponentSlot;
			},
			context
		);
	}

	return undefined;
}
