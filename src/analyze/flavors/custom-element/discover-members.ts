import { toSimpleType } from "ts-simple-type";
import { BinaryExpression, ExpressionStatement, Node, ReturnStatement } from "typescript";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getMemberVisibilityFromNode, hasModifier, isNamePrivate, isNodeWritableMember } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { relaxType } from "../../util/type-util";
import { ComponentMemberResult } from "../analyzer-flavor";

export function discoverMembers(node: Node, context: AnalyzerVisitContext): ComponentMemberResult[] | undefined {
	const { ts, checker } = context;

	// static get observedAttributes() { return ['c', 'l']; }
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword)) {
		if (node.name.getText() === "observedAttributes" && node.body != null) {
			const members: ComponentMemberResult[] = [];

			const returnStatement = node.body.statements.find(statement => ts.isReturnStatement(statement)) as ReturnStatement | undefined;
			if (returnStatement != null) {
				if (returnStatement.expression != null && ts.isArrayLiteralExpression(returnStatement.expression)) {
					// Emit an attribute for each string literal in the array.
					for (const attrNameNode of returnStatement.expression.elements) {
						const attrName = ts.isStringLiteralLike(attrNameNode) ? attrNameNode.text : undefined;
						if (attrName == null) continue;

						members.push({
							priority: "medium",
							member: {
								node: attrNameNode,
								jsDoc: getJsDoc(attrNameNode, ts),
								kind: "attribute",
								attrName,
								type: undefined // () => ({ kind: SimpleTypeKind.ANY } as SimpleType),
							}
						});
					}
				}
			}

			return members;
		}
	}

	// class { myProp = "hello"; }
	else if ((ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && isNodeWritableMember(node, ts)) {
		const { name, initializer } = node;

		if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
			// Find default value based on initializer
			const def = "initializer" in node && node.initializer != null ? resolveNodeValue(initializer, context)?.value : undefined;

			return [
				{
					priority: "high",
					member: {
						node,
						kind: "property",
						jsDoc: getJsDoc(node, ts),
						propName: name.text,
						type: lazy(() => checker.getTypeAtLocation(node)),
						default: def,
						visibility: getMemberVisibilityFromNode(node, ts)
						//required: isPropertyRequired(node, context.checker),
					}
				}
			];
		}
	}

	// class { set myProp(value: string) { ... } }
	else if (ts.isSetAccessor(node) && isNodeWritableMember(node, ts)) {
		const { name, parameters } = node;

		if (ts.isIdentifier(name) && parameters.length > 0) {
			const parameter = parameters[0];

			return [
				{
					priority: "high",
					member: {
						node,
						jsDoc: getJsDoc(node, ts),
						kind: "property",
						propName: name.text,
						type: lazy(() => context.checker.getTypeAtLocation(parameter)),
						visibility: getMemberVisibilityFromNode(node, ts)
					}
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

			const members: ComponentMemberResult[] = [];
			for (const assignment of assignments) {
				const { left, right } = assignment;

				if (ts.isPropertyAccessExpression(left)) {
					if (left.expression.kind === ts.SyntaxKind.ThisKeyword) {
						const propName = left.name.getText();

						members.push({
							priority: "low",
							member: {
								node,
								kind: "property",
								propName,
								default: resolveNodeValue(right, context)?.value,
								type: () => relaxType(toSimpleType(checker.getTypeAtLocation(right), checker)),
								jsDoc: getJsDoc(assignment.parent, ts),
								visibility: isNamePrivate(propName) ? "private" : undefined
							}
						});
					}
				}
			}

			return members;
		}
	}

	return undefined;
}
