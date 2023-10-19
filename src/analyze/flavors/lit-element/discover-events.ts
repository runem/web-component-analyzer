import { Node, ReturnStatement } from "typescript";
import { ComponentEvent } from "../../types/features/component-event";
import { hasModifier } from "../../util/ast-util";
import { AnalyzerDeclarationVisitContext } from "../analyzer-flavor";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { camelToDashCase } from "../../util/text-util";

/**
 * Discovers events dispatched
 * @param node
 * @param context
 */
export function discoverEvents(node: Node, context: AnalyzerDeclarationVisitContext): ComponentEvent[] | undefined {
	const { ts } = context;

	// Never pick up members not declared directly on the declaration node being traversed
	if (node.parent !== context.declarationNode) {
		return undefined;
	}

	// Polymer notify on properties
	// static get properties() { return { myProp: {notify: true} } }
	// https://polymer-library.polymer-project.org/3.0/docs/devguide/data-system#change-events
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword, ts)) {
		const name = node.name.getText();
		if (name === "properties" && node.body != null) {
			const returnStatement = node.body.statements.find<ReturnStatement>(ts.isReturnStatement.bind(ts));
			if (returnStatement != null) {
				return parseStaticProperties(returnStatement, context);
			}
		}
	}

	return undefined;
}

/**
 * Visits static properties
 * static get properties() { return { myProp: {type: String, notify: true} } }
 * @param returnStatement
 * @param context
 */
function parseStaticProperties(returnStatement: ReturnStatement, context: AnalyzerDeclarationVisitContext): ComponentEvent[] | undefined {
	const { ts } = context;

	const eventsResults: ComponentEvent[] = [];

	if (returnStatement.expression != null && ts.isObjectLiteralExpression(returnStatement.expression)) {
		// Each property in the object literal expression corresponds to a class field.
		for (const propNode of returnStatement.expression.properties) {
			// Get propName
			const propName = propNode.name != null && ts.isIdentifier(propNode.name) ? propNode.name.text : undefined;

			if (propName && ts.isPropertyAssignment(propNode)) {
				const resolved = resolveNodeValue(propNode.initializer, context);

				if (resolved && typeof resolved.value === "object" && resolved.value !== null && !Array.isArray(resolved.value)) {
					if (hasOwnProperty(resolved.value, "notify") && resolved.value.notify !== undefined) {
						if (resolved.value.notify) {
							eventsResults.push({
								jsDoc: {
									description: "Fired when the `" + propName + "` property changes",
									tags: [
										{
											tag: "type",
											parsed: () => {
												return {
													tag: "type",
													type: "CustomEvent<{value: *, path: ?string}>",
													className: "CustomEvent"
												};
											}
										}
									]
								},
								name: camelToDashCase(propName).toLowerCase() + "-changed",
								node: propNode
							});
						}
					}
				}
			}
		}
	}

	return eventsResults;
}

function hasOwnProperty<T extends string>(obj: object, key: T): obj is { [K in T]: unknown } {
	return Object.prototype.hasOwnProperty.call(obj, key);
}
