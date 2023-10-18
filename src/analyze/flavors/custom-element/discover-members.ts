import { toSimpleType } from "ts-simple-type";
import { BinaryExpression, ExpressionStatement, Node, ReturnStatement } from "typescript";
import { ComponentMember } from "../../types/features/component-member";
import { getMemberVisibilityFromNode, getModifiersFromNode, hasModifier } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { isNamePrivate } from "../../util/text-util";
import { relaxType } from "../../util/type-util";
import { AnalyzerDeclarationVisitContext } from "../analyzer-flavor";

/**
 * Discovers members based on standard vanilla custom element rules
 * @param node
 * @param context
 */
export function discoverMembers(node: Node, context: AnalyzerDeclarationVisitContext): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// Never pick up members not declared directly on the declaration node being traversed
	if (node.parent !== context.declarationNode) {
		return undefined;
	}

	// static get observedAttributes() { return ['c', 'l']; }
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword, ts)) {
		if (node.name.getText() === "observedAttributes" && node.body != null) {
			const members: ComponentMember[] = [];

			// Find either the first "return" statement or the first "array literal expression"
			const arrayLiteralExpression =
				(node.body.statements.find(statement => ts.isReturnStatement(statement)) as ReturnStatement | undefined)?.expression ??
				node.body.statements.find(statement => ts.isArrayLiteralExpression(statement));

			if (arrayLiteralExpression != null && ts.isArrayLiteralExpression(arrayLiteralExpression)) {
				// Emit an attribute for each string literal in the array.
				for (const attrNameNode of arrayLiteralExpression.elements) {
					const attrName = ts.isStringLiteralLike(attrNameNode) ? attrNameNode.text : undefined;
					if (attrName == null) continue;

					members.push({
						priority: "medium",
						node: attrNameNode,
						jsDoc: getJsDoc(attrNameNode, ts),
						kind: "attribute",
						attrName,
						type: undefined // () => ({ kind: "ANY" } as SimpleType),
					});
				}
			}

			return members;
		}
	}

	// class { myProp = "hello"; }
	else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
		const { name, initializer } = (() => {
			if (ts.isPropertySignature(node)) {
				return { name: node.name, initializer: undefined };
			}
			return node;
		})();

		if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
			// Always ignore the "prototype" property
			if (name.text === "prototype") {
				return undefined;
			}

			// Find default value based on initializer
			const resolvedDefaultValue = initializer != null ? resolveNodeValue(initializer, context) : undefined;
			const def = resolvedDefaultValue != null ? resolvedDefaultValue.value : initializer?.getText();

			return [
				{
					priority: "high",
					node,
					kind: "property",
					jsDoc: getJsDoc(node, ts),
					propName: name.text,
					type: lazy(() => checker.getTypeAtLocation(node)),
					default: def,
					visibility: getMemberVisibilityFromNode(node, ts),
					modifiers: getModifiersFromNode(node, ts)
					//required: isPropertyRequired(node, context.checker),
				}
			];
		}
	}

	// class { set myProp(value: string) { ... } }
	else if (ts.isSetAccessor(node) || ts.isGetAccessor(node)) {
		const { name, parameters } = node;

		if (ts.isIdentifier(name)) {
			const parameter = ts.isSetAccessor(node) != null && parameters?.length > 0 ? parameters[0] : undefined;

			return [
				{
					priority: "high",
					node,
					jsDoc: getJsDoc(node, ts),
					kind: "property",
					propName: name.text,
					type: lazy(() => (parameter == null ? context.checker.getTypeAtLocation(node) : context.checker.getTypeAtLocation(parameter))),
					visibility: getMemberVisibilityFromNode(node, ts),
					modifiers: getModifiersFromNode(node, ts)
				}
			];
		}
	}

	// constructor { super(); this.title = "Hello"; }
	else if (ts.isConstructorDeclaration(node)) {
		if (node.body != null) {
			const assignments = node.body.statements
				.filter((stmt): stmt is ExpressionStatement => ts.isExpressionStatement(stmt))
				.map(stmt => stmt.expression)
				.filter((exp): exp is BinaryExpression => ts.isBinaryExpression(exp));

			const members: ComponentMember[] = [];
			for (const assignment of assignments) {
				const { left, right } = assignment;

				if (ts.isPropertyAccessExpression(left)) {
					if (left.expression.kind === ts.SyntaxKind.ThisKeyword) {
						const propName = left.name.getText();

						const resolvedInitializer = resolveNodeValue(right, context);
						const def = resolvedInitializer != null ? resolvedInitializer.value : undefined; //right.getText();

						members.push({
							priority: "low",
							node,
							kind: "property",
							propName,
							default: def,
							type: () => relaxType(toSimpleType(checker.getTypeAtLocation(right), checker)),
							jsDoc: getJsDoc(assignment.parent, ts),
							visibility: isNamePrivate(propName) ? "private" : undefined
						});
					}
				}
			}

			return members;
		}
	}

	return undefined;
}
