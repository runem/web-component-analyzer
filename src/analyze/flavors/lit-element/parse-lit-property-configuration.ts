import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { CallExpression, Expression, Node, ObjectLiteralExpression } from "typescript";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { FlavorVisitContext } from "../parse-component-flavor";

export interface LitPropertyConfiguration {
	type?: SimpleType | string;
	attribute?: string | boolean;
	node?: {
		type?: Node;
		attribute?: Node;
	};
	hasConverter?: boolean;
	default?: object | string | number | boolean | null;
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
export function getLitElementPropertyDecoratorConfig(node: Node, context: FlavorVisitContext): undefined | LitPropertyConfiguration {
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

	// Build up the property configuration by looking at properties in the object literal expression
	return node.properties.reduce(
		(config, property) => {
			if (!ts.isPropertyAssignment(property)) return config;

			const initializer = property.initializer;
			const kind = ts.isIdentifier(property.name) ? property.name.text : undefined;

			return parseLitPropertyOption({ kind, initializer, config }, context);
		},
		{} as LitPropertyConfiguration
	);
}

export function parseLitPropertyOption(
	{ kind, initializer, config }: { kind: string | undefined; initializer: Expression; config: LitPropertyConfiguration },
	context: FlavorVisitContext
): LitPropertyConfiguration {
	const { ts, checker } = context;

	// noinspection DuplicateCaseLabelJS
	switch (kind) {
		case "converter": {
			return { ...config, hasConverter: true };
		}

		case "attribute": {
			let attribute: LitPropertyConfiguration["attribute"] | undefined;

			if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
				attribute = true;
			} else if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
				attribute = false;
			} else if (ts.isStringLiteral(initializer)) {
				attribute = initializer.text;
			}

			return {
				...config,
				attribute,
				node: {
					...(config.node || {}),
					attribute: initializer.parent
				}
			};
		}

		case "type": {
			let type: LitPropertyConfiguration["type"] | undefined;
			const value = ts.isIdentifier(initializer) ? initializer.text : undefined;

			switch (value) {
				case "String":
				case "StringConstructor":
					type = { kind: SimpleTypeKind.STRING };
					break;
				case "Number":
				case "NumberConstructor":
					type = { kind: SimpleTypeKind.NUMBER };
					break;
				case "Boolean":
				case "BooleanConstructor":
					type = { kind: SimpleTypeKind.BOOLEAN };
					break;
				case "Array":
				case "ArrayConstructor":
					type = { kind: SimpleTypeKind.ARRAY, type: { kind: SimpleTypeKind.ANY } };
					break;
				case "Object":
				case "ObjectConstructor":
					type = { kind: SimpleTypeKind.OBJECT, members: [] };
					break;
				default:
					// This is an unknown type, so set the name as a string
					type = initializer.getText();
					break;
			}

			return { ...config, type };
		}

		// Polymer specific field
		case "value": {
			return { ...config, default: resolveNodeValue(initializer, { ts, checker }) };
		}
	}

	return config;
}
