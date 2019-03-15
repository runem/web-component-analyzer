import { SimpleTypeKind } from "ts-simple-type";
import { Node, ReturnStatement } from "typescript";
import { ComponentMember } from "../../types/component-member";
import { hasModifier, hasPublicSetter, isPropertyRequired } from "../../util/ast-util";
import { getJsDoc } from "../../util/js-doc-util";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { ParseComponentMembersContext } from "../parse-component-flavor";

export function parseDeclarationMembers(node: Node, context: ParseComponentMembersContext): ComponentMember[] | undefined {
	const { ts, checker } = context;

	// static get observedAttributes() { return ['c', 'l']; }
	if (ts.isGetAccessor(node) && hasModifier(node, ts.SyntaxKind.StaticKeyword)) {
		if (node.name.getText() === "observedAttributes" && node.body != null) {
			const members: ComponentMember[] = [];

			const returnStatement = node.body.statements.find(statement => ts.isReturnStatement(statement)) as ReturnStatement | undefined;
			if (returnStatement != null) {
				if (returnStatement.expression != null && ts.isArrayLiteralExpression(returnStatement.expression)) {
					// Emit an attribute for each string literal in the array.
					for (const attrNameNode of returnStatement.expression.elements) {
						const attrName = ts.isStringLiteralLike(attrNameNode) ? attrNameNode.text : undefined;
						if (attrName == null) continue;

						members.push({
							kind: "attribute",
							attrName,
							type: { kind: SimpleTypeKind.ANY },
							node: attrNameNode
						});
					}
				}
			}

			return members;
		}
	}

	// class { myProp = "hello"; }
	else if ((ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) && hasPublicSetter(node, ts)) {
		const { name, initializer } = node;

		if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
			// Find default value based on initializer
			const def = "initializer" in node && node.initializer != null ? resolveNodeValue(initializer, context) : undefined;

			return [
				{
					kind: "property",
					propName: name.text,
					type: checker.getTypeAtLocation(node),
					required: isPropertyRequired(node, context.checker),
					default: def,
					jsDoc: getJsDoc(node, ts),
					node
				}
			];
		}
	}

	// class { 'hello'?: number }
	else if (ts.isConditionalExpression(node) && (ts.isStringLiteralLike(node.condition) || ts.isIdentifier(node.condition))) {
		return [
			{
				kind: "property",
				propName: node.condition.text,
				type: checker.getTypeAtLocation(node),
				jsDoc: getJsDoc(node, ts),
				node
			}
		];
	}

	// class { set myProp(value: string) { ... } }
	else if (ts.isSetAccessor(node) && hasPublicSetter(node, ts)) {
		const { name, parameters } = node;

		if (ts.isIdentifier(name) && parameters.length > 0) {
			const parameter = parameters[0];

			return [
				{
					kind: "property",
					propName: name.text,
					type: context.checker.getTypeAtLocation(parameter),
					jsDoc: getJsDoc(node, ts),
					required: false,
					node
				}
			];
		}
	}

	return undefined;
}
