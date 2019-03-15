import { Node } from "typescript";
import { ComponentCSSProperty } from "../../types/component-css-property";
import { ParseComponentMembersContext } from "../parse-component-flavor";
import { parseJsDocForNode } from "./helper";

/**
 * Parses @cssprop | @cssproperty js doc annotations on interface/class-like nodes.
 * @param node
 * @param context
 */
export function parseDeclarationCSSProps(node: Node, context: ParseComponentMembersContext): ComponentCSSProperty[] | undefined {
	const { ts } = context;

	if (ts.isInterfaceDeclaration(node) || ts.isClassDeclaration(node)) {
		return parseJsDocForNode(
			node,
			["cssprop", "cssproperty"],
			parsed => {
				if (parsed.name != null) {
					return {
						name: parsed.name,
						jsDoc: parsed.comment != null ? { comment: parsed.comment } : undefined
					} as ComponentCSSProperty;
				}
			},
			context
		);
	}

	return undefined;
}
