import { Node } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";

/**
 * Checks if the element has an lwc property decorator (@api).
 * @param node
 * @param context
 */
export function hasLwcApiPropertyDecorator(
	node: Node,
	context: AnalyzerVisitContext
): boolean {
	if (node.decorators == null) return false;
	const { ts } = context;

	// Find a decorator with "api" name.
	for (const decorator of node.decorators) {
		const expression = decorator.expression;

		// We find the first decorator calling specific identifier name (@api)
		// Note that this is not a call expression, so we just check that the decorator is an identifier
		if (ts.isIdentifier(expression)) {
			const kind = expression.text;
			if (kind==="api") {
				return true;
			}
		}
	}
	return false;
}
