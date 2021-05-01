import { CallExpression, Expression, Node, ObjectLiteralExpression } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { LitElementPropertyConfig } from "../../types/features/lit-element-property-config";
import { resolveNodeValue } from "../../util/resolve-node-value";

export type LitElementPropertyDecoratorKind = "property" | "internalProperty" | "state";

export const LIT_ELEMENT_PROPERTY_DECORATOR_KINDS: LitElementPropertyDecoratorKind[] = [
	"property",
	"internalProperty",
	"state"
];

/**
 * Returns a potential lit element property decorator.
 * @param node
 * @param context
 */
export function getLitElementPropertyDecorator(
	node: Node,
	context: AnalyzerVisitContext
): { expression: CallExpression; kind: LitElementPropertyDecoratorKind } | undefined {
	if (node.decorators == null) return undefined;
	const { ts } = context;

	// Find a decorator with "property" name.
	for (const decorator of node.decorators) {
		const expression = decorator.expression;

		// We find the first decorator calling specific identifier name (found in LIT_ELEMENT_PROPERTY_DECORATOR_KINDS)
		if (ts.isCallExpression(expression) && ts.isIdentifier(expression.expression)) {
			const identifier = expression.expression;
			const kind = identifier.text as LitElementPropertyDecoratorKind;
			if (LIT_ELEMENT_PROPERTY_DECORATOR_KINDS.includes(kind)) {
				return { expression, kind };
			}
		}
	}
}

/**
 * Returns a potential lit property decorator configuration.
 * @param node
 * @param context
 */
export function getLitElementPropertyDecoratorConfig(node: Node, context: AnalyzerVisitContext): undefined | LitElementPropertyConfig {
	const { ts } = context;

	// Get reference to a possible "@property" decorator.
	const decorator = getLitElementPropertyDecorator(node, context);

	if (decorator != null) {
		// Parse the first argument to the decorator which is the lit-property configuration.
		const configNode = decorator.expression.arguments[0];

		// Add decorator to "nodes"
		const config: LitElementPropertyConfig = { node: { decorator: decorator.expression } };

		// Apply specific config based on the decorator kind
		switch (decorator.kind) {
			case "internalProperty":
			case "state":
				config.attribute = false;
				config.state = true;
				break;
		}

		// Get lit options from the object literal expression
		return configNode != null && ts.isObjectLiteralExpression(configNode) ? getLitPropertyOptions(configNode, context, config) : config;
	}

	return undefined;
}

/**
 * Parses an object literal expression and returns a lit property configuration.
 * @param node
 * @param existingConfig
 * @param context
 */
export function getLitPropertyOptions(
	node: ObjectLiteralExpression,
	context: AnalyzerVisitContext,
	existingConfig: LitElementPropertyConfig = {}
): LitElementPropertyConfig {
	const { ts } = context;

	// Build up the property configuration by looking at properties in the object literal expression
	return node.properties.reduce((config, property) => {
		if (!ts.isPropertyAssignment(property)) return config;

		const initializer = property.initializer;
		const kind = ts.isIdentifier(property.name) ? property.name.text : undefined;

		return parseLitPropertyOption({ kind, initializer, config }, context);
	}, existingConfig);
}

export function parseLitPropertyOption(
	{ kind, initializer, config }: { kind: string | undefined; initializer: Expression; config: LitElementPropertyConfig },
	context: AnalyzerVisitContext
): LitElementPropertyConfig {
	const { ts, checker } = context;

	// noinspection DuplicateCaseLabelJS
	switch (kind) {
		case "converter": {
			return { ...config, hasConverter: true };
		}

		case "reflect": {
			return { ...config, reflect: resolveNodeValue(initializer, context)?.value === true };
		}

		case "state": {
			return { ...config, state: resolveNodeValue(initializer, context)?.value === true };
		}

		case "attribute": {
			let attribute: LitElementPropertyConfig["attribute"] | undefined;

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
					attribute: initializer
				}
			};
		}

		case "type": {
			let type: LitElementPropertyConfig["type"] | undefined;
			const value = ts.isIdentifier(initializer) ? initializer.text : undefined;

			switch (value) {
				case "String":
				case "StringConstructor":
					type = { kind: "STRING" };
					break;
				case "Number":
				case "NumberConstructor":
					type = { kind: "NUMBER" };
					break;
				case "Boolean":
				case "BooleanConstructor":
					type = { kind: "BOOLEAN" };
					break;
				case "Array":
				case "ArrayConstructor":
					type = { kind: "ARRAY", type: { kind: "ANY" } };
					break;
				case "Object":
				case "ObjectConstructor":
					type = { kind: "OBJECT", members: [] };
					break;
				default:
					// This is an unknown type, so set the name as a string
					type = initializer.getText();
					break;
			}

			return {
				...config,
				type,
				node: {
					...(config.node || {}),
					type: initializer
				}
			};
		}

		// Polymer specific field
		case "value": {
			return { ...config, default: resolveNodeValue(initializer, { ts, checker })?.value };
		}
	}

	return config;
}
