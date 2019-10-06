import { Node } from "typescript";
import { ParseComponentFlavor, VisitComponentDefinitionContext } from "../parse-component-flavor";
import { visitComponentDefinitions } from "./visit-component-definitions";

/**
 * Stencil flavor
 * This flavor finds and parses stencil related components.
 */
export class StencilFlavor implements ParseComponentFlavor {
	visitComponentDefinitions(node: Node, context: VisitComponentDefinitionContext): void {
		visitComponentDefinitions(node, context);
	}

	isNodeInLib(node: Node) {
		if (node.getSourceFile().fileName.endsWith("stencil.core.d.ts")) {
			return true;
		}
	}
}
