import { SimpleType } from "ts-simple-type";
import * as tsModule from "typescript";
import { CallExpression, Node, PropertyAssignment } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { LitElementPropertyConfig } from "../../types/features/lit-element-property-config";
import { getDecorators } from "../../util/ast-util";
import { resolveNodeValue } from "../../util/resolve-node-value";

export type LitElementPropertyDecoratorKind = "property" | "internalProperty" | "state";

export const LIT_ELEMENT_PROPERTY_DECORATOR_KINDS: LitElementPropertyDecoratorKind[] = ["property", "internalProperty", "state"];

/**
 * Returns a potential lit element property decorator.
 * @param node
 * @param context
 */
export function getLitElementPropertyDecorator(
	node: Node,
	context: AnalyzerVisitContext
): { expression: CallExpression; kind: LitElementPropertyDecoratorKind } | undefined {
	const { ts } = context;

	// Find a decorator with "property" name.
	for (const decorator of getDecorators(node, context)) {
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

	return undefined;
}

/**
 * Returns a potential lit property decorator configuration.
 * @param node
 * @param context
 */
export function getLitElementPropertyDecoratorConfig(node: Node, context: AnalyzerVisitContext): undefined | LitElementPropertyConfig {
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

		if (configNode == null) {
			return config;
		}

		const resolved = resolveNodeValue(configNode, context);

		return resolved != null ? getLitPropertyOptions(resolved.node, resolved.value, context, config) : config;
	}

	return undefined;
}

/**
 * Determines if a given object has the specified property, used
 * as a type-guard.
 * @param obj
 * @param key
 */
function hasOwnProperty<T extends string>(obj: object, key: T): obj is { [K in T]: unknown } {
	return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Computes the correct type for a given node for use in lit property
 * configuration.
 * @param ts
 * @param node
 */
export function getLitPropertyType(ts: typeof tsModule, node: Node): SimpleType | string {
	const value = ts.isIdentifier(node) ? node.text : undefined;

	switch (value) {
		case "String":
		case "StringConstructor":
			return { kind: "STRING" };
		case "Number":
		case "NumberConstructor":
			return { kind: "NUMBER" };
		case "Boolean":
		case "BooleanConstructor":
			return { kind: "BOOLEAN" };
		case "Array":
		case "ArrayConstructor":
			return { kind: "ARRAY", type: { kind: "ANY" } };
		case "Object":
		case "ObjectConstructor":
			return { kind: "OBJECT", members: [] };
		default:
			// This is an unknown type, so set the name as a string
			return node.getText();
	}
}

/**
 * Parses an object literal expression and returns a lit property configuration.
 * @param node
 * @param existingConfig
 * @param context
 */
export function getLitPropertyOptions(
	node: Node,
	object: unknown,
	context: AnalyzerVisitContext,
	existingConfig: LitElementPropertyConfig = {}
): LitElementPropertyConfig {
	const { ts } = context;
	const result: LitElementPropertyConfig = { ...existingConfig };
	let attributeInitializer: Node | undefined;
	let typeInitializer: Node | undefined;

	if (typeof object === "object" && object !== null && !Array.isArray(object)) {
		if (hasOwnProperty(object, "converter") && object.converter !== undefined) {
			result.hasConverter = true;
		}

		if (hasOwnProperty(object, "reflect") && object.reflect !== undefined) {
			result.reflect = object.reflect === true;
		}

		if (hasOwnProperty(object, "state") && object.state !== undefined) {
			result.state = object.state === true;
		}

		if (hasOwnProperty(object, "value")) {
			result.default = object.value;
		}

		if (hasOwnProperty(object, "attribute") && (typeof object.attribute === "boolean" || typeof object.attribute === "string")) {
			result.attribute = object.attribute;

			if (ts.isObjectLiteralExpression(node)) {
				const prop = node.properties.find(
					(p): p is PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "attribute"
				);
				if (prop) {
					attributeInitializer = prop.initializer;
				}
			}
		}
	}

	if (ts.isObjectLiteralExpression(node)) {
		const typeProp = node.properties.find(
			(p): p is PropertyAssignment => ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "type"
		);

		if (typeProp) {
			typeInitializer = typeProp.initializer;
			result.type = getLitPropertyType(ts, typeProp.initializer);
		}
	}

	return {
		...result,
		node: {
			...(result.node || {}),
			attribute: attributeInitializer,
			type: typeInitializer
		}
	};
}
