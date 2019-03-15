import { Node } from "typescript";
import { FlavorVisitContext, ParseComponentFlavor } from "../flavors/parse-component-flavor";
import { EventDeclaration } from "../types/event-types";

/**
 * Visits the source file and finds all global event declarations in the file.
 * @param node
 * @param flavors
 * @param context
 */
export function parseGlobalEvents(node: Node, flavors: ParseComponentFlavor[], context: FlavorVisitContext): EventDeclaration[] {
	if (node == null) return [];

	const globalEvents: EventDeclaration[] = [];

	for (const flavor of flavors) {
		if (flavor.visitGlobalEvents == null) continue;

		flavor.visitGlobalEvents(node, {
			...context,
			emitEvent(event: EventDeclaration): void {
				globalEvents.push(event);
			}
		});
	}

	return globalEvents;
}
