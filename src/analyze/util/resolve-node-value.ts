import * as tsModule from "typescript";
import { Node, TypeChecker } from "typescript";
import { resolveDeclarations } from "./ast-util";

export interface Context {
	ts: typeof tsModule;
	checker?: TypeChecker;
	depth?: number;
}

/**
 * Takes a node and tries to resolve a constant value from it.
 * Returns undefined if no constant value can be resolved.
 * @param node
 * @param context
 */
export function resolveNodeValue(node: Node | undefined, context: Context): string | number | boolean | undefined | null {
	if (node == null) return undefined;

	const { ts, checker } = context;
	const depth = (context.depth || 0) + 1;

	// Always break when depth is larger than 10.
	// This ensures we cannot run into infinite recursion.
	if (depth > 10) return undefined;

	if (ts.isStringLiteralLike(node)) {
		return node.text;
	} else if (ts.isNumericLiteral(node)) {
		return Number(node.text);
	} else if (ts.isObjectLiteralExpression(node)) {
		try {
			// Try to parse object literal expressions as JSON by converting it to something parsable
			const regex = /([a-zA-Z1-9]*?):/gm;
			const json = node.getText().replace(regex, (fullGroup, groupMatch) => `"${groupMatch}":`);
			return JSON.parse(json);
		} catch {
			// If something crashes it probably means that the object is more complex.
			// Therefore do nothing
		}
	} else if (node.kind === ts.SyntaxKind.TrueKeyword) {
		return true;
	} else if (node.kind === ts.SyntaxKind.FalseKeyword) {
		return false;
	} else if (node.kind === ts.SyntaxKind.NullKeyword) {
		return null;
	} else if (node.kind === ts.SyntaxKind.UndefinedKeyword) {
		return undefined;
	}

	// Resolve initializers for variable declarations
	if (ts.isVariableDeclaration(node)) {
		return resolveNodeValue(node.initializer, { ...context, depth });
	}

	// Resolve value of a property access expression. For example: MyEnum.RED
	else if (ts.isPropertyAccessExpression(node)) {
		return resolveNodeValue(node.name, { ...context, depth });
	}

	// Resolve initializer value of enum members.
	else if (ts.isEnumMember(node)) {
		if (node.initializer != null) {
			return resolveNodeValue(node.initializer, { ...context, depth });
		} else {
			return `${node.parent.name.text}.${node.name.getText()}`;
		}
	}

	// Resolve values of variables.
	else if (ts.isIdentifier(node) && checker != null) {
		const declaration = resolveDeclarations(node, { checker, ts }).filter(decl => ts.isVariableDeclaration(decl));
		return resolveNodeValue(declaration[0], { ...context, depth });
	}

	// Fallthrough
	//  - "my-value" as string
	//  - <any>"my-value"
	//  - ("my-value")
	else if (ts.isAsExpression(node) || ts.isTypeAssertion(node) || ts.isParenthesizedExpression(node)) {
		return resolveNodeValue(node.expression, { ...context, depth });
	}

	// static get is() {
	//    return "my-element";
	// }
	else if (ts.isGetAccessor(node) && node.body != null) {
		for (const stm of node.body.statements) {
			if (ts.isReturnStatement(stm)) {
				return resolveNodeValue(stm.expression, { ...context, depth });
			}
		}
	}

	return undefined;
}
