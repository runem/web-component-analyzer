import { Node, PropertyLikeDeclaration, PropertySignature, SetAccessorDeclaration } from "typescript";
import { getMemberVisibilityFromNode, getModifiersFromNode } from "../../util/ast-util";
import { AnalyzerVisitContext } from "../../analyzer-visit-context";
import { getJsDoc } from "../../util/js-doc-util";
import { lazy } from "../../util/lazy";
import { resolveNodeValue } from "../../util/resolve-node-value";
import { AnalyzerDeclarationVisitContext, ComponentMemberResult } from "../analyzer-flavor";
import { discoverInheritance } from "../custom-element/discover-inheritance";
/**
 * @param node
 * @param context
 */
export function discoverMembers(node: Node, context: AnalyzerDeclarationVisitContext): ComponentMemberResult[] | undefined {
	const { ts } = context;
	if (node.parent !== context.declarationNode) {
		return undefined;
	} else if (ts.isSetAccessor(node) || ts.isGetAccessor(node) || ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
		return parsePropertyDecorator(node, context);
	}
}
export type LwcElementPropertyDecoratorKind = "api" | "track";
export const LWC_ELEMENT_PROPERTY_DECORATOR_KINDS: LwcElementPropertyDecoratorKind[] = ["api", "track"];
/**
 * Returns a potential LWC element property decorator.
 * @param node
 * @param context
 */
export function getLwcElementPropertyDecorator(node: Node, context: AnalyzerVisitContext): { kind: LwcElementPropertyDecoratorKind } | undefined {
	if (node.decorators == null) {
		const heritage = discoverInheritance(node.parent, context);
		if (heritage) {
			const result = heritage.find(h => {
				return h.identifier.text === "LightningElement";
			});
			if (result) {
				return { kind: "track" };
			}
		}
		return undefined;
	}

	const { ts } = context;
	for (const decorator of node.decorators) {
		const expression = decorator.expression;
		if (ts.isIdentifier(expression)) {
			const identifier = expression;
			const kind = identifier.text as LwcElementPropertyDecoratorKind;
			if (LWC_ELEMENT_PROPERTY_DECORATOR_KINDS.includes(kind)) {
				return { kind };
			}
		}
	}
}
/**
 * Visits property decorator and returns members based on it.
 * @param node
 * @param context
 */
function parsePropertyDecorator(
	node: SetAccessorDeclaration | PropertyLikeDeclaration | PropertySignature,
	context: AnalyzerDeclarationVisitContext
): ComponentMemberResult[] | undefined {
	const { ts, checker } = context;
	const lwcElementPropertyDecorator = getLwcElementPropertyDecorator(node, context);
	if (lwcElementPropertyDecorator != null) {
		const propName = node.name.getText();
		const initializer = "initializer" in node ? node.initializer : undefined;
		const resolvedDefaultValue = initializer != null ? resolveNodeValue(initializer, context) : undefined;
		const def = resolvedDefaultValue != null ? resolvedDefaultValue.value : initializer?.getText();
		const required = undefined;
		const jsDoc = getJsDoc(node, ts);
		return [
			{
				priority: "high",
				member: {
					kind: "property",
					propName,
					type: lazy(() => {
						return checker.getTypeAtLocation(node);
					}),
					node,
					default: def,
					required,
					jsDoc,
					visibility:
						lwcElementPropertyDecorator.kind === "track"
							? "private"
							: lwcElementPropertyDecorator.kind === "api"
							? "public"
							: getMemberVisibilityFromNode(node, ts),
					modifiers: getModifiersFromNode(node, ts)
				}
			}
		];
	}
	return undefined;
}
