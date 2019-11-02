import { Node } from "typescript";
import { ComponentCSSPart } from "../../types/component-css-part";
import { ComponentCSSProperty } from "../../types/component-css-property";
import { ComponentMember } from "../../types/component-member";
import { ComponentSlot } from "../../types/component-slot";
import { EventDeclaration } from "../../types/event-types";
import { ParseComponentFlavor, ParseComponentMembersContext, VisitComponentDefinitionContext } from "../parse-component-flavor";
import { parseDeclarationCSSProps } from "./parse-declaration-css-props";
import { parseDeclarationCSSParts } from "./parse-declaration-css-parts";
import { parseDeclarationEvents } from "./parse-declaration-events";
import { parseDeclarationMembers } from "./parse-declaration-members";
import { parseDeclarationSlots } from "./parse-declaration-slots";
import { visitComponentDefinitions } from "./visit-component-definitions";

/**
 * JsDoc Flavor.
 * This flavor only looks at jsdoc and continues the visiting flavors in children nodes after emitting members.
 */
export class JsDocFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): void {
		visitComponentDefinitions(node, context);
	}

	parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
		return parseDeclarationMembers(node, context);
	}

	parseDeclarationEvents(node: Node, context: ParseComponentMembersContext): EventDeclaration[] | undefined {
		return parseDeclarationEvents(node, context);
	}

	parseDeclarationSlots(node: Node, context: ParseComponentMembersContext): ComponentSlot[] | undefined {
		return parseDeclarationSlots(node, context);
	}

	parseDeclarationCSSProps(node: Node, context: ParseComponentMembersContext): ComponentCSSProperty[] | undefined {
		return parseDeclarationCSSProps(node, context);
	}

	parseDeclarationCSSParts(node: Node, context: ParseComponentMembersContext): ComponentCSSPart[] | undefined {
		return parseDeclarationCSSParts(node, context);
	}
}
