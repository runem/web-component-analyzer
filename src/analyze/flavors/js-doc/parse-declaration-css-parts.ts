import { Node } from "typescript";
import { ComponentCSSPart } from "../../types/component-css-part";
import { ParseComponentMembersContext } from "../parse-component-flavor";
import { parseJsDocForNode } from "./helper";

/**
 * Parses @csspart jsdoc annotations on interface/class-like nodes.
 * @param node
 * @param context
 */
export function parseDeclarationCSSParts(node: Node, context: ParseComponentMembersContext): ComponentCSSPart[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			["csspart"],
			(tagNode, parsed) => {
				if (parsed.name != null) {
					return {
						name: parsed.name,
						jsDoc: parsed.comment != null ? { comment: parsed.comment } : undefined
					} as ComponentCSSPart;
				}
			},
			context
		);
	}

	return undefined;
}
