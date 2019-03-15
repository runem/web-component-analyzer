import { SimpleTypeKind } from "ts-simple-type";
import { Node } from "typescript";
import { getInterfaceKeys } from "../../util/ast-util";
import { ParseVisitContextGlobalEvents } from "../parse-component-flavor";

/**
 * Visits and finds global events.
 * @param node
 * @param context
 */
export function visitGlobalEvents(node: Node, context: ParseVisitContextGlobalEvents): void {
	const { ts } = context;

	// declare global { interface HTMLElementEventMap  { "my-event": CustomEvent<string>; } }
	if (ts.isInterfaceDeclaration(node) && node.name.text === "HTMLElementEventMap") {
		const extensions = getInterfaceKeys(node, context);
		for (const [eventName] of extensions) {
			context.emitEvent({ type: { kind: SimpleTypeKind.ANY }, name: eventName, node });
		}

		return;
	}

	node.forEachChild(child => {
		visitGlobalEvents(child, context);
	});
}
