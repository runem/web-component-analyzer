import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { CallExpression, Node, ObjectLiteralExpression } from "typescript";
import { FlavorVisitContext } from "../parse-component-flavor";

export interface LitPropertyConfiguration {
	type?: SimpleType;
	attribute?: string | boolean;
	node?: {
		type?: Node;
		attribute?: Node;
	};
	hasConverter?: boolean;
}

/**
 * Returns a potential lit element property decorator.
 * @param node
 * @param context
 */
export function getLitElementPropertyDecorator(node: Node, context: FlavorVisitContext): undefined | CallExpression {
	if (node.decorators == null) return undefined;
	const { ts } = context;

	// Find a decorator with "property" name.
	const decorator = node.decorators.find(decorator => {
		const expression = decorator.expression;
		return ts.isCallExpression(expression) && ts.isIdentifier(expression.expression) && expression.expression.text === "property";
	});

	return decorator != null && ts.isCallExpression(decorator.expression) ? decorator.expression : undefined;
}

/**
 * Returns a potential lit property decorator configuration.
 * @param node
 * @param context
 */
export function getLitPropertyConfiguration(node: Node, context: FlavorVisitContext): undefined | LitPropertyConfiguration {
	const { ts } = context;

	// Get reference to a possible "@property" decorator.
	const decorator = getLitElementPropertyDecorator(node, context);

	if (decorator != null) {
		// Parse the first argument to the decorator which is the lit-property configuration.
		const configNode = decorator.arguments[0];
		return configNode != null && ts.isObjectLiteralExpression(configNode) ? getLitPropertyOptions(configNode, context) : {};
	}

	return undefined;
}

/**
 * Parses an object literal expression and returns a lit property configuration.
 * @param node
 * @param context
 */
export function getLitPropertyOptions(node: ObjectLiteralExpression, context: FlavorVisitContext): LitPropertyConfiguration {
	const { ts } = context;

	const config: LitPropertyConfiguration = {};

	// Build up the property configuration by looking at properties in the object literal expression
	for (const property of node.properties) {
		if (!ts.isPropertyAssignment(property)) continue;

		const initializer = property.initializer;
		const name = ts.isIdentifier(property.name) ? property.name.text : undefined;

		switch (name) {
			case "converter": {
				config.hasConverter = true;
				break;
			}

			case "attribute": {
				if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
					config.attribute = true;
				} else if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
					config.attribute = false;
				} else if (ts.isStringLiteral(initializer)) {
					config.attribute = initializer.text;
				}

				config.node = {
					...(config.node || {}),
					attribute: property
				};

				break;
			}

			case "type": {
				const value = ts.isIdentifier(initializer) ? initializer.text : undefined;

				switch (value) {
					case "String":
					case "StringConstructor":
						config.type = { kind: SimpleTypeKind.STRING };
						break;
					case "Number":
					case "NumberConstructor":
						config.type = { kind: SimpleTypeKind.NUMBER };
						break;
					case "Boolean":
					case "BooleanConstructor":
						config.type = { kind: SimpleTypeKind.BOOLEAN };
						break;
					case "Array":
					case "ArrayConstructor":
						config.type = { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } };
						break;
					default:
						config.type = { kind: SimpleTypeKind.OBJECT, members: [] };
						break;
				}

				config.node = {
					...(config.node || {}),
					type: property
				};

				break;
			}
		}
	}

	return config;
}
