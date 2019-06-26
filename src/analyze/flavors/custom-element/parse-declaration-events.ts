import { SimpleType, SimpleTypeKind } from "ts-simple-type";
import { Node, Type } from "typescript";
import { EventDeclaration } from "../../types/event-types";
import { getJsDoc } from "../../util/js-doc-util";
import { ParseComponentMembersContext } from "../parse-component-flavor";

export function parseDeclarationEvents(node: Node, context: ParseComponentMembersContext): EventDeclaration[] | undefined {
	const { ts, checker } = context;

	// new CustomEvent("my-event");
	if (ts.isNewExpression(node)) {
		const { expression, arguments: args, typeArguments } = node;

		if (expression.getText() === "CustomEvent" && args && args.length >= 1) {
			const arg = args[0];

			if (ts.isStringLiteralLike(arg)) {
				const eventName = arg.text;

				// Either grab jsdoc from the new expression or from a possible call expression that its wrapped in
				const jsDoc =
					getJsDoc(expression, ts) ||
					(() => ts.isCallLikeExpression(node.parent) && getJsDoc(node.parent.parent, ts))() ||
					(() => ts.isExpressionStatement(node.parent) && getJsDoc(node.parent, ts))() ||
					undefined;

				const type: SimpleType | Type = (typeArguments && typeArguments[0] && checker.getTypeFromTypeNode(typeArguments[0])) || {
					kind: SimpleTypeKind.ANY
				};

				return [
					{
						jsDoc,
						name: eventName,
						node,
						type
					}
				];
			}
		}
	}

	return undefined;
}
