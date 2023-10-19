import * as tsModule from "typescript";
import { Node, SyntaxKind, TypeChecker } from "typescript";
import { resolveDeclarations } from "./ast-util";

export interface Context {
	ts: typeof tsModule;
	checker?: TypeChecker;
	depth?: number;
	strict?: boolean;
}

/**
 * Takes a node and tries to resolve a constant value from it.
 * Returns undefined if no constant value can be resolved.
 * @param node
 * @param context
 */
export function resolveNodeValue(node: Node | undefined, context: Context): { value: unknown; node: Node } | undefined {
	if (node == null) return undefined;

	const { ts, checker } = context;
	const depth = (context.depth || 0) + 1;

	// Always break when depth is larger than 10.
	// This ensures we cannot run into infinite recursion.
	if (depth > 10) return undefined;

	if (ts.isStringLiteralLike(node)) {
		return { value: node.text, node };
	} else if (ts.isNumericLiteral(node)) {
		return { value: Number(node.text), node };
	} else if (ts.isPrefixUnaryExpression(node)) {
		const value = resolveNodeValue(node.operand, { ...context, depth })?.value;
		return { value: applyPrefixUnaryOperatorToValue(value, node.operator, ts), node };
	} else if (ts.isObjectLiteralExpression(node)) {
		const object: Record<string, unknown> = {};

		for (const prop of node.properties) {
			if (ts.isPropertyAssignment(prop)) {
				// Resolve the "key"
				const name = resolveNodeValue(prop.name, { ...context, depth })?.value || prop.name.getText();

				// Resolve the "value
				const resolvedValue = resolveNodeValue(prop.initializer, { ...context, depth });
				if (resolvedValue != null && typeof name === "string") {
					object[name] = resolvedValue.value;
				}
			}
		}

		return {
			value: object,
			node
		};
	} else if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return { value: true, node };
	} else if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return { value: false, node };
	} else if (node.kind === ts.SyntaxKind.NullKeyword) {
		return { value: null, node };
	} else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
		return { value: undefined, node };
	}

	// Resolve initializers for variable declarations
	if (ts.isVariableDeclaration(node)) {
		return resolveNodeValue(node.initializer, { ...context, depth });
	}

	// Resolve value of a property access expression. For example: MyEnum.RED
	else if (ts.isPropertyAccessExpression(node)) {
		return resolveNodeValue(node.name, { ...context, depth });
	}

	// Resolve [expression] parts of {[expression]: "value"}
	else if (ts.isComputedPropertyName(node)) {
		return resolveNodeValue(node.expression, { ...context, depth });
	}

	// Resolve initializer value of enum members.
	else if (ts.isEnumMember(node)) {
		if (node.initializer != null) {
			return resolveNodeValue(node.initializer, { ...context, depth });
		} else {
			return { value: `${node.parent.name.text}.${node.name.getText()}`, node };
		}
	}

	// Resolve values of variables.
	else if (ts.isIdentifier(node) && checker != null) {
		const declarations = resolveDeclarations(node, { checker, ts });
		if (declarations.length > 0) {
			const resolved = resolveNodeValue(declarations[0], { ...context, depth });
			if (context.strict || resolved != null) {
				return resolved;
			}
		}

		if (context.strict) {
			return undefined;
		}

		return { value: node.getText(), node };
	}

	// Fallthrough
	//  - "my-value" as string
	//  - <any>"my-value"
	//  - ("my-value")
	else if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node) || ts.isParenthesizedExpression(node)) {
		return resolveNodeValue(node.expression, { ...context, depth });
	}

	// static get is() {
	//    return "my-element";
	// }
	else if ((ts.isGetAccessor(node) || ts.isMethodDeclaration(node) || ts.isFunctionDeclaration(node)) && node.body != null) {
		for (const stm of node.body.statements) {
			if (ts.isReturnStatement(stm)) {
				return resolveNodeValue(stm.expression, { ...context, depth });
			}
		}
	}

	// [1, 2]
	else if (ts.isArrayLiteralExpression(node)) {
		return {
			node,
			value: node.elements.map(el => resolveNodeValue(el, { ...context, depth })?.value)
		};
	}

	if (ts.isTypeAliasDeclaration(node)) {
		return resolveNodeValue(node.type, { ...context, depth });
	}

	if (ts.isLiteralTypeNode(node)) {
		return resolveNodeValue(node.literal, { ...context, depth });
	}

	if (ts.isTypeReferenceNode(node)) {
		return resolveNodeValue(node.typeName, { ...context, depth });
	}

	return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPrefixUnaryOperatorToValue(value: any, operator: SyntaxKind, ts: typeof tsModule): any {
	if (typeof value === "object" && value != null) {
		return value;
	}

	switch (operator) {
		case ts.SyntaxKind.MinusToken:
			return -value;
		case ts.SyntaxKind.ExclamationToken:
			return !value;
		case ts.SyntaxKind.PlusToken:
			return +value;
	}

	return value;
}
