import { SimpleTypeKind } from "ts-simple-type";
import { Node } from "typescript";
import { EventDeclaration } from "../../types/event-types";
import { parseJsDocTypeString } from "../../util/js-doc-util";
import { ParseComponentMembersContext } from "../parse-component-flavor";
import { parseJsDocForNode } from "./helper";

/**
 * Parses @fires js doc annotations on interface/class-like nodes.
 * @param node
 * @param context
 */
export function parseDeclarationEvents(node: Node, context: ParseComponentMembersContext): EventDeclaration[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			["event", "fires", "emits"],
			(tagNode, parsed) => {
				if (parsed.name != null) {
					return {
						name: parsed.name,
						jsDoc: parsed.comment != null ? { comment: parsed.comment } : undefined,
						type: (parsed.type && parseJsDocTypeString(parsed.type)) || { kind: SimpleTypeKind.ANY },
						node: tagNode
					} as EventDeclaration;
				}
			},
			context
		);
	}

	return undefined;
}
