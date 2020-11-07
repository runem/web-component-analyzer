import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { ComponentEvent } from "../../types/features/component-event";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";

const EVENT_NAMES = [
	"Event",
	"CustomEvent",
	"AnimationEvent",
	"ClipboardEvent",
	"DragEvent",
	"FocusEvent",
	"HashChangeEvent",
	"InputEvent",
	"KeyboardEvent",
	"MouseEvent",
	"PageTransitionEvent",
	"PopStateEvent",
	"ProgressEvent",
	"StorageEvent",
	"TouchEvent",
	"TransitionEvent",
	"UiEvent",
	"WheelEvent"
];

/**
 * Discovers events dispatched
 * @param node
 * @param context
 */
export function discoverEvents(node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined {
	const { ts, checker } = context;

	// new CustomEvent("my-event");
	if (ts.isNewExpression(node)) {
		const { expression, arguments: args } = node;

		if (EVENT_NAMES.includes(expression.getText()) && args && args.length >= 1) {
			const arg = args[0];

			const eventName = resolveNodeValue(arg, { ...context, strict: true })?.value;

			if (typeof eventName === "string") {
				// Either grab jsdoc from the new expression or from a possible call expression that its wrapped in
				const jsDoc =
					getJsDoc(expression, ts) ||
					(ts.isCallLikeExpression(node.parent) && getJsDoc(node.parent.parent, ts)) ||
					(ts.isExpressionStatement(node.parent) && getJsDoc(node.parent, ts)) ||
					undefined;

				return [
					{
						jsDoc,
						name: eventName,
						node,
						type: lazy(() => checker.getTypeAtLocation(node))
					}
				];
			}
		}
	}

	return undefined;
}
