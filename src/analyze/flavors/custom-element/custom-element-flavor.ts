import { Node } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { EventDeclaration } from "../../types/event-types";
import { isNodeInLibDom } from "../../util/ast-util";
import {
	ParseComponentFlavor,
	ParseComponentMembersContext,
	ParseVisitContextGlobalEvents,
	VisitComponentDefinitionContext
} from "../parse-component-flavor";
import { parseDeclarationEvents } from "./parse-declaration-events";
import { parseDeclarationMembers } from "./parse-declaration-members";
import { visitComponentDefinitions } from "./visit-component-definitions";
import { visitGlobalEvents } from "./visit-global-events";

/**
 * Custom element flavor.
 * This is the base flavor and affects many other flavors because it finds properties and definitions.
 */
export class CustomElementFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): void {
		visitComponentDefinitions(node, context);
	}

	parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
		return parseDeclarationMembers(node, context);
	}

	parseDeclarationEvents(node: Node, context: ParseComponentMembersContext): EventDeclaration[] | undefined {
		return parseDeclarationEvents(node, context);
	}

	visitGlobalEvents(node: Node, context: ParseVisitContextGlobalEvents): void {
		visitGlobalEvents(node, context);
	}

	isNodeInLib(node: Node) {
		if (isNodeInLibDom(node)) {
			return true;
		}
	}
}
