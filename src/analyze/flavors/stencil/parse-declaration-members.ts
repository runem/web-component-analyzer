import { Node } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { ParseComponentMembersContext } from "../parse-component-flavor";

/**
 * Parses declaration members. This function is made to be used only on interfaces declared
 * using the "StencilIntrinsicElements" global typing interface because this interface only has attributes.
 * @param node
 * @param context
 */
export function parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// Don't visit interfaces in "stencil.core.d.ts" because it's basically a copy of HTMLElement which we don't want to include.
	if (node.getSourceFile().fileName.endsWith("stencil.core.d.ts") && !context.config.analyzeLibDom) {
		return undefined;
	}

	// class { myAttr: string; }
	if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node) || ts.isConditionalExpression(node)) {
		const name = ts.isConditionalExpression(node) ? node.condition : node.name;
		if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
			return [
				{
					kind: "attribute",
					attrName: name.text,
					type: checker.getTypeAtLocation(node),
					node
				}
			];
		}
	}
}
