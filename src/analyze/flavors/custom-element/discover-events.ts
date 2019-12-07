import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { Node } from "typescript";
import { ComponentEvent } from "../../types/features/component-event";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

/**
 * Discovers events dispatched
 * @param node
 * @param context
 */
export function discoverEvents(node: Node, context: AnalyzerVisitContext): ComponentEvent[] | undefined {
	const { ts, checker } = context;

	// new CustomEvent("my-event");
	if (ts.isNewExpression(node)) {
		const { expression, arguments: args, typeArguments } = node;

		if (expression.getText() === "CustomEvent" && args && args.length >= 1) {
			const arg = args[0];

			if (ts.isStringLiteralLike(arg)) {
				const eventName = arg.text;

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
						type: lazy(() => {
							return (
								(typeArguments?.[0] != null && checker.getTypeFromTypeNode(typeArguments[0])) ||
								({
									kind: SimpleTypeKind.ANY
								} as SimpleType)
							);
						})
					}
				];
			}
		}
	}

	return undefined;
}
