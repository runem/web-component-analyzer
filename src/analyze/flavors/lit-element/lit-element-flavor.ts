import { Node } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { ParseComponentFlavor, ParseComponentMembersContext, VisitComponentDefinitionContext } from "../parse-component-flavor";
import { parseDeclarationMembers } from "./parse-declaration-members";
import { visitComponentDefinitions } from "./visit-component-definitions";

export class LitElementFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): void {
		visitComponentDefinitions(node, context);
	}

	parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
		return parseDeclarationMembers(node, context);
	}

	isNodeInLib(node: Node, context: ParseComponentMembersContext) {
		if (context.ts.isClassLike(node)) {
			const name = (node.name != null && node.name.text) || "";
			if (["LitElement", "PolymerElement", "Polymer.Element"].includes(name)) {
				return true;
			}
		}
	}
}
